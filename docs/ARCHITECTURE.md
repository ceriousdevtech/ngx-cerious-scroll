# ngx-cerious-scroll Architecture

**Copyright (c) 2024-2026 Cerious DevTech LLC. All rights reserved.**

## Table of Contents

1. [Overview](#overview)
2. [Component Hierarchy](#component-hierarchy)
3. [DOM Structure](#dom-structure)
4. [Render Pipeline](#render-pipeline)
5. [Height Measurement Strategy](#height-measurement-strategy)
6. [NgZone Strategy](#ngzone-strategy)
7. [View Lifecycle and Pruning](#view-lifecycle-and-pruning)
8. [Lifecycle and Engine Recreation](#lifecycle-and-engine-recreation)
9. [Viewport Change Observable](#viewport-change-observable)
10. [Key Design Decisions](#key-design-decisions)

---

## Overview

`ngx-cerious-scroll` is an Angular 17+ binding over the `@ceriousdevtech/cerious-scroll` engine. It bridges two fundamentally different rendering models:

- **CeriousScroll engine** — imperative, DOM-first, synchronous height measurement, incremental rendering, fires its own DOM events
- **Angular** — zone-based change detection, `EmbeddedViewRef` template rendering, `ApplicationRef` view management, RxJS event streams

The three principal challenges in the Angular integration are:

1. **Synchronous measurement** — Angular templates must be committed to the DOM before the engine reads `offsetHeight`.
2. **Zone discipline** — scroll events must not trigger a full `ApplicationRef.tick()` per row or per event; only one coalesced tick per animation frame.
3. **View leaks** — `EmbeddedViewRef`s detached from `ApplicationRef` but not destroyed accumulate over time and make `tick()` progressively slower.

---

## Component Hierarchy

```
CeriousScrollComponent           (cerious-scroll.component.ts)
  └── [hostDirectives]
        └── CeriousScrollDirective    (cerious-scroll.directive.ts)
              └── CeriousScrollService.createHost()  (cerious-scroll.service.ts)
                    ├── CeriousScrollEngine           (@ceriousdevtech/cerious-scroll)
                    └── ceriousViewportChange$()      (cerious-scroll.observable.ts)

CeriousScrollItemTemplateDirective  (cerious-scroll-item-template.directive.ts)
  — marks <ng-template ceriousScrollItem> for pickup by CeriousScrollComponent
```

There are two public entry points:
- **`<cerious-scroll>`** (`CeriousScrollComponent`) — declarative component with an `<ng-template ceriousScrollItem>` content child. Maps component inputs/outputs to the directive via `hostDirectives`.
- **`[ceriousScroll]`** (`CeriousScrollDirective`) — applies to any element. Requires `[ceriousScrollItemTemplate]` to be set explicitly (no projected template pickup).

---

## DOM Structure

```
<div [ceriousScroll] | <cerious-scroll>   [host element]
     style="position:relative; overflow:hidden" (set by caller)
  │
  ├── <div data-cerious-scroll-content>   ← CeriousScrollService.ensureContentElement()
  │     ├── <div>  [engine row container, index 0]
  │     │     └── [EmbeddedViewRef rootNodes appended here]
  │     ├── <div>  [engine row container, index 1]
  │     │     └── [EmbeddedViewRef rootNodes appended here]
  │     └── ...
  │
  └── <div data-cerious-native-scrollbar>  ← managed by engine (if enabled)
```

The `data-cerious-scroll-content` element separates row DOM from the native scrollbar. The engine clears row containers with `textContent = ''` during recycling — without this separation the scrollbar element would be wiped each render pass.

Unlike the React and Vue wrappers, the Angular wrapper does **not** use inner mount nodes. Angular's `EmbeddedViewRef` is created fresh per container (previous views are destroyed before a new one is created), so the engine's container management does not conflict with Angular's view ownership.

---

## Render Pipeline

```
CeriousScrollDirective.render()
  │
  ├── 1. Build ElementRenderer callback
  │     └── this.renderTemplateIntoContainer(template, index, elementContainer)
  │           a. Destroy any previous EmbeddedViewRef for this container
  │           b. elementContainer.textContent = ''  (clear recycled DOM)
  │           c. template.createEmbeddedView({ $implicit: item, item, index })
  │           d. appRef.attachView(view)
  │           e. view.detectChanges()  ← synchronous CD, commits DOM
  │           f. Append view.rootNodes to elementContainer
  │           g. viewByContainer.set(elementContainer, view)
  │
  ├── 2. instance.renderViewport(height, contentContainer, renderer)
  │     └── Engine calls renderer per row, reads offsetHeight after each
  │         ↳ view.detectChanges() already committed DOM synchronously
  │
  ├── 3. pruneDetachedViews()
  │     └── For containers no longer in getRenderedIndices():
  │           appRef.detachView(view)
  │           view.destroy()
  │           viewByContainer.delete(container)
  │
  └── 4. Emit ceriousScrollMeasuredViewport (inside ngZone.run if observed)
```

---

## Height Measurement Strategy

The engine calls the `ElementRenderer` callback and immediately reads `el.offsetHeight`. `view.detectChanges()` is called **before** `rootNodes` are appended to the container — this runs the full change detection cycle (inputs → child components → DOM) so the nodes are fully formed. Appending them then makes them part of the document layout tree, and the subsequent `offsetHeight` read returns the real height.

```
template.createEmbeddedView(ctx)
  → appRef.attachView(view)       [registers with global change detection]
  → view.detectChanges()          [commits bindings to DOM nodes (not yet in document)]
  → elementContainer.appendChild(rootNodes)  [places in layout tree]
  → [engine reads offsetHeight]   [real height, no estimation needed]
```

---

## NgZone Strategy

Scroll events (wheel, touch, keyboard, scrollbar drag) are fired inside the engine, which runs **outside** Angular's zone via `ngZone.runOutsideAngular()` in `CeriousScrollService.createHost()`. This means:

- Engine event listeners do not trigger `ApplicationRef.tick()`.
- The `onScroll` hook fires outside the zone. It calls `scheduleRender()`, which queues one `requestAnimationFrame`.

The `scheduleRender` frame callback runs **inside** `ngZone.run()`:

```typescript
this.scheduledRenderFrame = requestAnimationFrame(() => {
  this.scheduledRenderFrame = null;
  this.ngZone.run(() => this.render());
});
```

`ngZone.run()` triggers one `ApplicationRef.tick()` after the callback completes — one coalesced tick per animation frame, regardless of how many scroll events fired between frames.

**Why `ngZone.run()` in the frame callback and not per-row?** Angular row templates may contain event bindings (`(click)="..."`, etc.). When a template is rendered outside the zone (no `ngZone.run()`), those event listeners are added outside the zone and clicks on scrolled-in rows do not trigger change detection. Running the entire render pass inside `ngZone.run()` ensures listeners are registered in the zone.

**`view.detectChanges()` vs `appRef.tick()`**: each row uses `view.detectChanges()` for local, synchronous CD. This is O(1 view) and does not affect other components. The global `tick()` is produced only by `ngZone.run()` finishing, which happens once per frame.

---

## View Lifecycle and Pruning

`CeriousScrollDirective` maintains a `viewByContainer` Map:

```typescript
private readonly viewByContainer = new Map<HTMLElement, EmbeddedViewRef<...>>();
```

Keys are engine row containers (the `HTMLElement`s managed by the `ViewportRenderer`). Values are the `EmbeddedViewRef` currently rendered into each container.

### `pruneDetachedViews()`

After each `renderViewport` call, views whose container is no longer in `getRenderedIndices()` are fully destroyed:

```typescript
for (const [container, view] of this.viewByContainer) {
  if (!active.has(container)) {
    this.appRef.detachView(view);
    view.destroy();
    this.viewByContainer.delete(container);
  }
}
```

Without this step, every container the engine recycles leaves its `EmbeddedViewRef` attached to `ApplicationRef` forever. `ApplicationRef`'s internal `_views` array (iterated on every `tick()`) grows without bound, and scrolling gets progressively slower.

### `renderTemplateIntoContainer()`

Before creating a new view for a container, any previous view is destroyed:

```typescript
const previous = this.viewByContainer.get(elementContainer);
if (previous) {
  this.appRef.detachView(previous);
  previous.destroy();
  this.viewByContainer.delete(elementContainer);
}
```

This handles the case where an engine container is reused for a different row index.

### `refreshRenderedContent()`

When the `items` array changes identity but the length stays the same, views are **not** destroyed. Instead, the context of each existing view is updated in place:

```typescript
view.context.$implicit = item;
view.context.item = item;
view.context.index = index;
view.detectChanges();
```

This preserves DOM state (focused inputs, open dropdowns, selection ranges) across data-reference changes, and avoids the cost of destroying and recreating views for every immutable data update.

---

## Lifecycle and Engine Recreation

```
ngAfterViewInit()
  └── ensureInitialized()
        ├── CeriousScrollService.createHost(container, total, options, ngZone, onScrollHook)
        │     └── ngZone.runOutsideAngular(() => new CeriousScrollEngine(...))
        ├── viewportSub = hostRef.viewportChanges$.subscribe(...)
        ├── ceriousScrollReady.emit(scroller)
        └── queueMicrotask(() => render())  [after current CD cycle]

ngOnChanges(changes)
  ├── items / totalElements changed, count changed → recreate()
  ├── items / totalElements changed, same count   → refreshRenderedContent() + render()
  └── options changed (not first change)          → recreate()

ngOnDestroy()
  ├── cancelAnimationFrame(scheduledRenderFrame)
  ├── viewportSub.unsubscribe()
  ├── destroyAllViews()
  └── hostRef.destroy()
        ├── contentEl.textContent = ''
        ├── scroller.detachScrollbar(container)
        └── scroller.dispose()
```

**`queueMicrotask`** is used for the initial render (and after recreation via `ensureInitialized`) so the render happens after the current change detection cycle completes. This ensures that `ContentChild` queries (like `projectedItemTemplate` in `CeriousScrollComponent`) are resolved before `render()` is called.

---

## Viewport Change Observable

`CeriousScrollService.createHost()` returns a `viewportChanges$` observable backed by `ceriousViewportChange$()`, which merges two DOM events:

```typescript
merge(
  fromEvent(container, 'cerious-viewport-change').pipe(map(e => e.detail)),
  fromEvent(container, 'viewport-change').pipe(map(e => normalizeScrollbarEvent(e)))
).pipe(share())
```

- `cerious-viewport-change` — emitted by wheel/touch/keyboard handlers.
- `viewport-change` — emitted by the native scrollbar integration.

The directive subscribes and emits to `ceriousScrollViewportChange` inside `ngZone.run()` (only when the output has subscribers, to avoid unnecessary ticks).

---

## Key Design Decisions

### `hostDirectives` in `CeriousScrollComponent`

The component exposes a clean `<cerious-scroll>` API by delegating to `CeriousScrollDirective` via `hostDirectives`. The component's inputs/outputs are aliases mapped directly to the directive's inputs/outputs. This means there is no duplication of logic — the component is purely a template entry point.

### `CeriousScrollService`

The service isolates engine construction and provides `ngZone.runOutsideAngular()`. Encapsulating this in a service makes testing easier (the service can be mocked) and keeps the directive free of `new CeriousScroll(...)` call sites.

### No Inner Mount Nodes

The React and Vue wrappers use inner mount nodes because their respective render APIs are either asynchronous (React portals) or maintain internal tree state that must not be externally wiped (Vue vnode tree). Angular's `EmbeddedViewRef` keeps its rootNodes as detached DOM nodes — the wrapper controls when and where they are appended. Destroying the view and creating a fresh one is cheap (Angular's template compiler pre-compiles the factory), so there is no need for the extra mount node indirection.

### `requestAnimationFrame` Coalescing

The engine can fire multiple `onScroll` callbacks between frames (e.g. the native scrollbar fires many events during a drag). `scheduleRender()` uses `requestAnimationFrame` with a guard (`if (this.scheduledRenderFrame != null) return`) so only one render happens per animation frame.
