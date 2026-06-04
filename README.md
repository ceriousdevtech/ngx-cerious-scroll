# @ceriousdevtech/ngx-cerious-scroll

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://ceriousdevtech.github.io/ngx-cerious-scroll/)

**Angular bindings for [Cerious Scroll™](https://www.npmjs.com/package/@ceriousdevtech/cerious-scroll)** — high-performance virtual scrolling with **O(1) memory**, consistent **60 FPS+**, and **native variable-height support with no height estimation**.

Rows are rendered into the engine's own measured containers via Angular's `EmbeddedViewRef` and committed synchronously, so every row's real height is measured (never estimated) — exactly the guarantee that makes CeriousScroll precise. Because rows stay in your Angular tree, **DI, pipes, and structural directives work normally** inside each row.

---

## Installation

```bash
npm install @ceriousdevtech/ngx-cerious-scroll @ceriousdevtech/cerious-scroll
```

`@angular/core` and `@angular/common` (>= 16) are peer dependencies.

---

## Demo

**[Live demo →](https://ceriousdevtech.github.io/ngx-cerious-scroll/)** — 100,000 rows, fixed/variable-height toggle, imperative jump-to-row, and live viewport stats.

To run locally:

```bash
npm install
npm run build    # build the library
npm start        # dev server with HMR (http://localhost:4300/)
```

The demo imports the wrapper by its package name, aliased to the built library,
so rebuild the library after editing `projects/ngx-cerious-scroll/src/`.

---

## Quick start (component)

Give the host a height; provide `items` and an `<ng-template ceriousScrollItem>`.

```ts
import { Component } from '@angular/core';
import {
  CeriousScrollComponent,
  CeriousScrollItemTemplateDirective,
} from '@ceriousdevtech/ngx-cerious-scroll';

@Component({
  standalone: true,
  imports: [CeriousScrollComponent, CeriousScrollItemTemplateDirective],
  template: `
    <cerious-scroll [items]="items" style="height: 480px">
      <ng-template ceriousScrollItem let-item let-index="index">
        <div class="row">{{ index }} — {{ item.name }}</div>
      </ng-template>
    </cerious-scroll>
  `,
})
export class List {
  items = Array.from({ length: 1_000_000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
}
```

Variable heights need no configuration — just render rows of whatever height; the
engine measures each one.

### Without a full array (huge / sparse data)

```html
<cerious-scroll
  [totalElements]="100_000_000"
  [getItem]="loadRow"
  style="height: 600px"
>
  <ng-template ceriousScrollItem let-item let-index="index">
    <app-row [data]="item" [index]="index" />
  </ng-template>
</cerious-scroll>
```

---

## Directive

`[ceriousScroll]` gives you full control on any host element. Pass a
`TemplateRef` via `[ceriousScrollItemTemplate]`; the directive renders rows
imperatively into the engine's measured containers.

```ts
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CeriousScrollDirective } from '@ceriousdevtech/ngx-cerious-scroll';

@Component({
  standalone: true,
  imports: [CeriousScrollDirective],
  template: `
    <ng-template #row let-item let-index="index">
      <div class="row">{{ index }} — {{ item.name }}</div>
    </ng-template>

    <div
      ceriousScroll
      [ceriousScrollItems]="items"
      [ceriousScrollItemTemplate]="row"
      style="height: 480px; position: relative; overflow: hidden"
    ></div>
  `,
})
export class List {
  @ViewChild('row', { static: true }) row!: TemplateRef<any>;
  items = /* ... */;
}
```

---

## Component inputs

| Input | Type | Description |
| --- | --- | --- |
| `items` | `readonly TItem[]` | Optional data array. `totalElements` defaults to `items.length`. |
| `totalElements` | `number` | Total item count. Required if `items` is omitted. |
| `getItem` | `(index) => TItem` | Lazy item getter for large/sparse datasets. |
| `itemTemplate` | `TemplateRef<{ $implicit, index }>` | Row template. Alternative to projecting `<ng-template ceriousScrollItem>`. |
| `options` | `CeriousScrollOptions` | Engine options (keyboard/touch/wheel/scrollbar/etc.). Read once at creation. |
| `autoRender` | `boolean` | Re-render on scroll/resize/data changes. Default `true`. |

The row is provided by the projected `<ng-template ceriousScrollItem let-item let-index="index">` or the `itemTemplate` input. Apply `class` / `style` directly to `<cerious-scroll>` — it's a block-level host (set a height!).

### Outputs

| Output | Payload | Description |
| --- | --- | --- |
| `viewportChange` | `CeriousViewportChangeDetail` | Normalized viewport-change (wheel/touch/keyboard/scrollbar). |
| `measuredViewport` | `MeasuredViewportRange` | Measured range after each render pass. |
| `scrollerReady` | `CeriousScroll` | The underlying engine instance, once ready. |

### Imperative API (via template reference)

```html
<cerious-scroll #scroll [items]="items">…</cerious-scroll>
```

```ts
@ViewChild(CeriousScrollDirective) scroll!: CeriousScrollDirective;
// scroll.jumpToElement(500);
// scroll.scrollToPercentage(50);
// scroll.reset();
// scroll.render();
// scroll.recalculate();           // drop cached heights + re-measure (see Notes)
// scroll.hostRef?.scroller;       // the raw engine
```

---

## Notes

- **No height estimation.** Rows are committed synchronously via
  `EmbeddedViewRef.detectChanges()` so the engine measures real `offsetHeight`.
  Later size changes are picked up by the engine's built-in `ResizeObserver`.
- **`options` are read at creation.** Changing `options` after init has no
  effect; recreate the host (e.g. with `*ngIf` toggling) to apply new engine
  options.
- **Changing the item count** recreates the engine internally (scroll position
  is preserved). Mutating items without changing the count just re-renders the
  content in place (cheap; Angular patches each row, so focus/selection survive)
  — it does **not** discard cached heights, so editable grids that produce a new
  `items` array on every edit don't trigger a full viewport re-measure.
- **If every rendered row's height changes at once** (e.g. a density/layout
  switch) the cached heights become stale and rows can misalign until the next
  scroll. Call `recalculate()` on the directive instance right after the change
  to drop the height cache and re-measure. Don't call it on routine edits — a
  single cell edit keeps its row's size, and the engine's built-in
  `ResizeObserver` picks up any incidental resize on its own.

---

## License

Licensed by **Cerious DevTech LLC** under the **MIT License** (see `LICENSE`).

📧 info@ceriousdevtech.com
