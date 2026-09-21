# ngx-cerious-scroll Implementation Guide

**Copyright (c) 2024-2026 Cerious DevTech LLC. All rights reserved.**

---

## Table of Contents

1. [How the Directive Works Internally](#how-the-directive-works-internally)
2. [Component vs Directive Entry Points](#component-vs-directive-entry-points)
3. [Modifying the Render Pipeline](#modifying-the-render-pipeline)
4. [Adding New Imperative Methods](#adding-new-imperative-methods)
5. [Inputs That Recreate the Engine vs Inputs That Don't](#inputs-that-recreate-the-engine-vs-inputs-that-dont)
6. [Testing](#testing)
7. [Common Pitfalls](#common-pitfalls)
8. [Build and Release](#build-and-release)

---

## How the Directive Works Internally

`CeriousScrollDirective` is the core of the Angular wrapper. It owns one `CeriousScrollHostRef` (from `CeriousScrollService`) across the lifetime of the host element.

### Initialization (`ngAfterViewInit` → `ensureInitialized`)

1. `CeriousScrollService.createHost()` instantiates the engine via `ngZone.runOutsideAngular()`. The engine's internal event listeners (wheel, touch, keyboard, resize, content observer) are all added outside Angular's zone: they do not trigger `ApplicationRef.tick()`.
2. The `onScrollHook` callback (called by the engine's `onScroll`) calls `scheduleRender()`, which coalesces all scroll events in a frame into one `requestAnimationFrame` callback. That frame callback runs `ngZone.run(() => this.render())`: one `ApplicationRef.tick()` per frame.
3. `viewportChanges$` is subscribed. When the output `ceriousScrollViewportChange` has observers, the detail is emitted inside `ngZone.run()`.
4. `ceriousScrollReady.emit(scroller)` fires with the engine instance.
5. `queueMicrotask(() => this.render())` schedules the first render after the current CD cycle (so `ContentChild` queries in `CeriousScrollComponent` are resolved first).

### Render Pass (`render()`)

For each row the engine requests via the `ElementRenderer` callback, `renderTemplateIntoContainer()` runs:
1. Any existing `EmbeddedViewRef` for that container is destroyed.
2. `elementContainer.textContent = ''` clears recycled DOM.
3. `template.createEmbeddedView({ $implicit: item, item, index })` creates a fresh embedded view.
4. `appRef.attachView(view)` registers it with global change detection.
5. `view.detectChanges()` commits the view's bindings to DOM nodes **synchronously**.
6. `view.rootNodes` are appended to `elementContainer`.
7. The engine reads `offsetHeight`: it is real, not estimated.

After `renderViewport` completes, `pruneDetachedViews()` destroys views whose containers are no longer rendered.

### Teardown (`ngOnDestroy`)

1. Pending `requestAnimationFrame` is cancelled.
2. `viewportSub.unsubscribe()`.
3. `destroyAllViews()`, detaches and destroys every `EmbeddedViewRef` in `viewByContainer`.
4. `hostRef.destroy()`, clears content DOM, detaches scrollbar, disposes engine.

---

## Component vs Directive Entry Points

### `<cerious-scroll>` (Component)

Use when you have a template with `<ng-template ceriousScrollItem>`:

```html
<cerious-scroll [items]="items" style="height: 600px; display: block;">
  <ng-template ceriousScrollItem let-item let-index="index">
    <div class="row">{{ index }}: {{ item.title }}</div>
  </ng-template>
</cerious-scroll>
```

The component uses `hostDirectives` to delegate all inputs/outputs to `CeriousScrollDirective`. After content initialization, `CeriousScrollComponent.ngAfterContentInit()` transfers the projected template reference to the directive.

### `[ceriousScroll]` (Directive)

Use on any element when you need full control or want to avoid the component wrapper:

```html
<div
  ceriousScroll
  [ceriousScrollItems]="items"
  [ceriousScrollItemTemplate]="rowTemplate"
  style="height: 600px; overflow: hidden;"
></div>

<ng-template #rowTemplate let-item let-index="index">
  <div class="row">{{ index }}: {{ item.title }}</div>
</ng-template>
```

With the directive, `[ceriousScrollItemTemplate]` must be set explicitly: there is no `ContentChild` pickup.

### Input name mapping

| Component input | Directive input |
|---|---|
| `[items]` | `[ceriousScrollItems]` |
| `[totalElements]` | `[ceriousScrollTotalElements]` |
| `[getItem]` | `[ceriousScrollGetItem]` |
| `[itemTemplate]` | `[ceriousScrollItemTemplate]` |
| `[options]` | `[ceriousScrollOptions]` |
| `[autoRender]` | `[ceriousScrollAutoRender]` |
| `(viewportChange)` | `(ceriousScrollViewportChange)` |
| `(measuredViewport)` | `(ceriousScrollMeasuredViewport)` |
| `(scrollerReady)` | `(ceriousScrollReady)` |

---

## Modifying the Render Pipeline

The render pipeline is in `CeriousScrollDirective.render()`. To extend it:

**Adding a pre-render hook:**

```typescript
render(): MeasuredViewportRange | null {
  if (!this.hostRef) return null;
  const template = this.ceriousScrollItemTemplate;
  if (!template) return null;

  this.onBeforeRender();  // add your hook here

  const hostContainer = this.host.nativeElement;
  // ...rest of existing render body
}
```

**Customizing how rows are rendered:** modify `renderTemplateIntoContainer()`. For example, to inject additional context:

```typescript
private renderTemplateIntoContainer(
  template: TemplateRef<CeriousScrollItemTemplateContext<TItem>>,
  index: number,
  elementContainer: HTMLElement
): void {
  // ...existing destroy-previous block...

  const item = this.getItemForIndex(index);
  const view = template.createEmbeddedView({
    $implicit: item,
    item,
    index,
    myExtraContext: this.extraData,  // extend the context type too
  });
  this.appRef.attachView(view);
  view.detectChanges();

  for (const node of view.rootNodes) {
    elementContainer.appendChild(node);
  }
  this.viewByContainer.set(elementContainer, view);
}
```

---

## Adding New Imperative Methods

Add new methods to `CeriousScrollDirective` as public methods. They are accessible via a template ref on the component or directive:

```typescript
// cerious-scroll.directive.ts

/** Scroll to the last element. */
scrollToBottom(): MeasuredViewportRange | null {
  if (!this.hostRef) return null;
  this.hostRef.scroller.jumpToElement(this.hostRef.scroller.totalElements - 1);
  return this.render();
}
```

Usage in a template:

```html
<cerious-scroll #scroller [items]="items" ...>
  ...
</cerious-scroll>
<button (click)="scroller.scrollToBottom()">Bottom</button>
```

Or via `ViewChild` in a component:

```typescript
@ViewChild(CeriousScrollComponent) private scroller!: CeriousScrollComponent;
// Then:
this.scroller.scrollToBottom();
```

Note: `CeriousScrollComponent` exposes the directive's methods through `hostDirectives` output aliasing only for inputs/outputs, for imperative methods you need to inject the directive or use `ViewChild` on the component directly (Angular propagates the host directive's public API through the component instance when queried with `ViewChild`).

---

## Inputs That Recreate the Engine vs Inputs That Don't

| Input | `ngOnChanges` behavior |
|---|---|
| `ceriousScrollItems` / `ceriousScrollTotalElements` (count changed) | **Recreates engine**, `recreate()` |
| `ceriousScrollItems` (same length, new reference) | Updates in place, `refreshRenderedContent()` + `render()` |
| `ceriousScrollOptions` (after first change) | **Recreates engine**, `recreate()` |
| `ceriousScrollGetItem` | No engine recreation, new function used on next render pass |
| `ceriousScrollItemTemplate` | No engine recreation, new template used on next render pass |
| `ceriousScrollAutoRender` | No engine recreation, affects next scroll event |

**Why count change recreates the engine:** the `ViewportRenderer` inside the engine stores a copy of `totalElements` at construction. Patching the public property leaves the renderer's internal bound stale, causing phantom renders at out-of-bounds indices (undefined items → 0-height rows → the fill loop never satisfies its height condition → hundreds of renderer callbacks). Recreation gives the engine and renderer a consistent count.

---

## Testing

Tests live in `projects/ngx-cerious-scroll/src/lib/`. Each source file has a corresponding `.spec.ts`. The suite uses Karma + Jasmine (Angular's default).

**Running tests:**

```bash
npx ng test ngx-cerious-scroll
```

**Running tests headlessly (CI):**

```bash
npx ng test ngx-cerious-scroll --watch=false --browsers=ChromeHeadless
```

**Key testing patterns:**

```typescript
// TestBed setup
TestBed.configureTestingModule({
  imports: [CeriousScrollComponent, CeriousScrollDirective],
});

const fixture = TestBed.createComponent(TestHostComponent);
fixture.detectChanges();

// Access the directive
const directive = fixture.debugElement
  .query(By.directive(CeriousScrollDirective))
  .injector.get(CeriousScrollDirective);

directive.jumpToElement(50);
fixture.detectChanges();
```

**Mocking the service:**

```typescript
const mockService: Partial<CeriousScrollService> = {
  createHost: jasmine.createSpy('createHost').and.returnValue({
    scroller: mockScroller,
    contentElement: document.createElement('div'),
    viewportChanges$: EMPTY,
    destroy: jasmine.createSpy('destroy'),
  }),
};

TestBed.configureTestingModule({
  providers: [{ provide: CeriousScrollService, useValue: mockService }],
  imports: [CeriousScrollDirective],
});
```

---

## Engine Options the Directive Forwards

`ceriousScrollOptions` reaches the engine as-is, so the core's
[implementation guide](https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md)
is the reference for what each option does. This section covers only what is
different because Angular is in the middle.

### `sticky`

The pinned header is rendered through your item template but mounted outside the
recycler, so its embedded view is exempt from `pruneDetachedViews()`. That is
what keeps it populated once its own row scrolls out.

Two constraints on the template:

- **It must be idempotent.** One index is drawn twice at the same time.
- **Its root should be a real element**, not a bare `@if` / `@switch` block. A
  control-flow root gives the view nothing but anchor comments as root nodes,
  and the pinned header is populated by re-parenting a view. Wrap it in a
  `display: contents` div.

`resolve` runs on every window move, so keep it O(sections), not O(dataset).

### `infinite`

Grow the bound array. The engine re-anchors in place, so the camera does not
move. Return the promise from `onLoadMore`, or a slow endpoint is asked again on
the next frame.

One Angular-specific step. The recycler does not re-run the item template for an
index it already holds, and an embedded view only re-evaluates when something
asks it to. So if a placeholder becomes real data at the *same* index, which is
exactly what happens to a "loading" row at the tail, call
`refreshRenderedContent()` after the data lands:

```ts
onLoadMore = (ctx: InfiniteLoadContext) =>
  this.api.page(ctx.total).then((page) => {
    this.rows = this.rows.concat(page.items);
    // The row that WAS the spinner now holds a real item. Re-bind what is on
    // screen, or it keeps showing the spinner until it is recycled, which a
    // slow scroll never forces.
    this.scroller?.refreshRenderedContent();
  });
```

React and Vue do not need this: their rows re-render when the bound item changes
identity.

### `aria`

Nothing Angular-specific. Leave `role`/`itemRole` unset for `layout: 'table'`:
`<tr>` and `<td>` already carry real semantics that a role would replace.

### `snap` and `direction`

Nothing Angular-specific, and that is the whole entry. Both act on the engine's
own scroll math and on the elements it positions itself, neither of which
Angular takes part in, so they behave exactly as the
[core guide](https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md)
describes.

```html
[ceriousScrollOptions]="{
  snap: { enabled: true, align: 'nearest', tolerance: 2 },
  direction: 'auto'
}"
```

Two things follow from the options being read once. Toggling either at runtime
means re-creating the element, and `direction: 'auto'` is resolved at that
moment, so flipping a `dir` attribute on an ancestor later has no effect until
the instance is recreated. Write row CSS with logical properties
(`padding-inline-start`, `text-align: start`) and it follows the direction on
its own.

### `ssr`

The module touches no DOM at import time, so Angular Universal can render the
list. Server-render each row inside an element carrying `data-element-index`,
wrapped in one marked `data-cerious-scroll-content`.

If you supply that markup through an `[innerHTML]` binding, remember that
Angular's sanitizer drops `data-*` attributes: pass it through
`DomSanitizer.bypassSecurityTrustHtml`, or `data-element-index` will not survive
and there will be nothing for the engine to match.

Styling is the other half, and it is easy to miss. Server markup never passes
through Angular, so it carries no `_ngcontent-*` attribute and emulated
encapsulation's scoped selectors will not match it. Adopted rows then render
unstyled next to the client's own, which looks exactly like the hydration
mismatch you were trying to avoid. Put the row styles somewhere global, either
in the global stylesheet or behind `ViewEncapsulation.None` on the component
that owns the list.

---

## Common Pitfalls

### The host element must have an explicit height and `display: block`

For the directive, set `style="height: 600px; overflow: hidden;"` on the host element. For `<cerious-scroll>`, the component adds `display: block` via its `styles` but you still need a height: `style="height: 600px;"`.

Without a height, `container.clientHeight` is 0 and `renderViewport` renders 0 rows.

### `options` changes recreate the engine

Unlike the React/Vue wrappers (where `options` changes are silently ignored), the Angular wrapper recreates the engine when `ceriousScrollOptions` changes after the first render. This is consistent with Angular's `OnChanges` contract. To avoid unintentional recreation, create the options object once:

```typescript
// In your component:
readonly scrollOptions: CeriousScrollOptions = {
  wheel: { enabled: true },
  touch: { enabled: true },
};
// NOT: [options]="{ wheel: { enabled: true } }"  ← new object every render
```

### `recalculate()` is expensive. Use it only for bulk height changes

`recalculate()` calls `scroller.clearAllCaches()` and re-renders. Use it only when every row's height changes at once (density switch, font size change). For routine data edits or single-row expand/collapse, the engine's `ResizeObserver` handles height changes automatically.

### `ceriousScrollAutoRender: false` disables all automatic rendering

With `autoRender = false`, scroll events do not trigger renders, you must call `render()` manually from the template ref or a `ViewChild`. This is useful when you need to control the render timing precisely (e.g. after a custom animation completes).

### Zone-crossing event listeners

Angular template event bindings (`(click)="..."`) on rows rendered outside `ngZone.run()` would not trigger change detection. The wrapper ensures rows are rendered inside `ngZone.run()` via the `requestAnimationFrame` callback. Do not bypass `scheduleRender()` by calling `render()` directly from outside the zone.

---

### A pinned `sticky` header renders empty

Two causes, in order of likelihood:

1. **The item template's root is a control-flow block.** Wrap it in an element
   (`<div style="display: contents">`). See the `sticky` notes above.
2. **The item template is not idempotent.** The pinned row is rendered a second
   time, concurrently with the row itself, so anything that mutates state or
   depends on call order will misbehave.

### Changes to the library are not picked up by the demo

`tsconfig.json` maps `ngx-cerious-scroll` to `./dist/ngx-cerious-scroll`, so the
demo consumes the *built* library. Run `ng build ngx-cerious-scroll` after
editing anything under `projects/ngx-cerious-scroll/src` or you will be testing
the previous build.

---

## Build and Release

The workspace uses Angular CLI with two projects: `ngx-cerious-scroll` (library) and `demo` (demo app).

```bash
# Build the library (outputs to dist/ngx-cerious-scroll/)
npx ng build ngx-cerious-scroll

# Serve the demo (http://localhost:4200)
npx ng serve demo

# Build the demo for production
npx ng build demo

# Build the demo for GitHub Pages (base-href required)
npx ng build demo --base-href /ngx-cerious-scroll/
```

The library uses `ng-packagr` (configured via `ng-package.json`). It outputs FESM2022, ESM2022, and type declarations. The publishable package is at `projects/ngx-cerious-scroll/package.json`: the workspace root `package.json` is private and not published.

### Demo output path

Angular 17+ outputs the demo build to `dist/demo/browser/` (not `dist/demo/`). The GitHub Pages workflow copies from that path.
