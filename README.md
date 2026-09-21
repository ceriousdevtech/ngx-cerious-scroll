# @ceriousdevtech/ngx-cerious-scroll

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://ceriousdevtech.github.io/ngx-cerious-scroll/)

**Angular bindings for [Cerious Scroll™](https://www.npmjs.com/package/@ceriousdevtech/cerious-scroll)**: high-performance virtual scrolling with **O(1) memory**, consistent **60 FPS+**, and **native variable-height support with no height estimation**.

Rows are rendered into the engine's own measured containers via Angular's `EmbeddedViewRef` and committed synchronously, so every row's real height is measured (never estimated): exactly the guarantee that makes CeriousScroll precise. Because rows stay in your Angular tree, **DI, pipes, and structural directives work normally** inside each row.

---

## Installation

```bash
npm install @ceriousdevtech/ngx-cerious-scroll @ceriousdevtech/cerious-scroll
```

`@angular/core` and `@angular/common` (>= 16) are peer dependencies.

---

## Demo

**[Live demo →](https://ceriousdevtech.github.io/ngx-cerious-scroll/)**: 100,000 rows, fixed/variable-height toggle, imperative jump-to-row, and live viewport stats.

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
        <div class="row">{{ index }}, {{ item.name }}</div>
      </ng-template>
    </cerious-scroll>
  `,
})
export class List {
  items = Array.from({ length: 1_000_000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
}
```

Variable heights need no configuration, just render rows of whatever height; the
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
      <div class="row">{{ index }}, {{ item.name }}</div>
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
| `headerTemplate` | `TemplateRef` | Table mode only. `<tr>` of `<th>`s rendered into the engine's `<thead>` (see [Table layout](#table-layout)). |
| `options` | `CeriousScrollOptions` | Engine options. Masonry's DOM callback is supplied by the directive. Read once at creation. |
| `autoRender` | `boolean` | Re-render on scroll/resize/data changes. Default `true`. |

The row is provided by the projected `<ng-template ceriousScrollItem let-item let-index="index">` or the `itemTemplate` input. Apply `class` / `style` directly to `<cerious-scroll>`, it's a block-level host (set a height!).

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
// scroll.jumpToItem(500);          // Masonry cards
// scroll.scrollToPercentage(50);
// scroll.reset();
// scroll.render();
// scroll.recalculate();           // drop cached heights + re-measure (see Notes)
// scroll.hostRef?.scroller;       // the raw engine
```

---

## Masonry layout

Pass `layout: 'masonry'` and the directive renders your Angular template into
the engine's cards. Do not provide the core DOM `renderItem` callback:

```html
<div
  class="gallery"
  ceriousScroll
  [ceriousScrollTotalElements]="photos.length"
  [ceriousScrollGetItem]="getPhoto"
  [ceriousScrollItemTemplate]="card"
  [ceriousScrollOptions]="masonryOptions"
></div>

<ng-template #card let-photo let-index="index">
  <app-photo-card [photo]="photo" [index]="index" />
</ng-template>
```

```ts
readonly masonryOptions: CeriousScrollOptions = {
  layout: 'masonry',
  masonry: {
    getItemHeight: (_index, width) => width * 0.75 + 48,
    targetColumnWidth: 280,
    gap: 16,
  },
};
```

Omit `getItemHeight` for dynamic measurement. Angular creates a short-lived
embedded view for the offscreen probe and destroys it after the synchronous
height read; visible cards retain normal bindings and events.

Use `directive.jumpToItem(index, screenOffset?)` for card navigation. The demo
gallery includes canonical and dynamic Masonry pages.

## Table layout

Pass `[ceriousScrollOptions]="{ layout: 'table' }"` to render real `<table>` / `<tr>` / `<td>` rows with a frozen header and native column alignment. The row template returns the row's `<td>` cells; `[ceriousScrollHeaderTemplate]` provides the `<thead>` row (it updates via change detection):

```html
<div
  class="my-scroll"
  ceriousScroll
  [ceriousScrollTotalElements]="100000"
  [ceriousScrollGetItem]="getItem"
  [ceriousScrollItemTemplate]="rowTpl"
  [ceriousScrollHeaderTemplate]="headerTpl"
  [ceriousScrollOptions]="{ layout: 'table', table: { tableClassName: 'my-table', autoSizeColumns: true } }"
></div>

<ng-template #headerTpl>
  <tr>
    @for (c of columns; track c.key) { <th>{{ c.label }}</th> }
  </tr>
</ng-template>

<!-- Row template roots must be <td>s (no structural directive at the root). -->
<ng-template #rowTpl let-index>
  <td>{{ row(index).id }}</td>
  <td>{{ row(index).name }}</td>
  <td>{{ row(index).email }}</td>
</ng-template>
```

`<cerious-scroll>` exposes the same via `[headerTemplate]` and `<ng-template ceriousScrollItem>`.

- The **header template** renders into the engine's `<thead>` (same `<table>` as the rows → native column alignment, frozen header).
- The **row template's root nodes must be `<td>`s** (don't wrap them in a structural directive at the root: that hides the cells from the directive's recycle re-append).
- **`table.autoSizeColumns`** measures column widths once and pins them (auto-sized + stable); or use `table.columnWidths`. Variable row heights work as usual.
- CSS: `border-collapse: separate` and an **opaque `<thead>` background** (see the core README's [Table Layout](https://github.com/ceriousdevtech/cerious-scroll#-table-layout-layout-table) notes).

---

## Capabilities

These are engine options, set through `ceriousScrollOptions` and forwarded to
the core unchanged. They combine with any layout unless noted.

| Option | What it does |
| --- | --- |
| `sticky` | Pins one dataset row to the top while you are inside its section. The pinned element is drawn outside the recycler, so it survives its own row scrolling out of the mounted window. |
| `snap` | Settles the camera on a row boundary after scrolling stops. |
| `infinite` | Calls `onLoadMore` as a threshold near an edge is crossed, once per approach. Grow the bound array and the camera does not move. |
| `aria` | Writes `aria-setsize` and `aria-posinset` from the real dataset, so a screen reader announces "item 40,112 of 500,000" rather than the size of the mounted window. Opt-in. |
| `direction` | `'ltr'`, `'rtl'` or `'auto'` to read the host's own computed direction. |
| `ssr` | `hydrate: true` adopts pre-rendered rows on the first render instead of clearing them, matched by `data-element-index`. |

```html
<div
  ceriousScroll
  [ceriousScrollItems]="rows"
  [ceriousScrollItemTemplate]="rowTpl"
  [ceriousScrollOptions]="{
    sticky: { resolve: resolveSection, className: 'is-pinned' },
    snap: { enabled: true, align: 'nearest', tolerance: 2 },
    infinite: { threshold: 20, edges: 'end', onLoadMore: onLoadMore },
    aria: { enabled: true, label: 'Search results' },
    direction: 'auto'
  }"
></div>
```

Options are read once, at creation. To flip one of these at runtime, re-create
the element (for example behind an `@if`).

### `sticky` in Angular

The engine renders the pinned header through your own item template, so a
section header and that same row scrolling past are one piece of markup. The
directive keeps the pinned element's embedded view out of the prune pass that
reclaims rows leaving the viewport, which is what lets it survive its row
leaving the mounted window.

Two constraints:

- **The item template must be idempotent.** One index is drawn in two places at
  once, so it has to be a pure function of the bound item.
- **Give the template a real element at its root**, not a bare `@if` / `@switch`
  block. A control-flow block's root nodes are only its anchor comments, and the
  pinned header is populated by re-parenting a view, which moves the anchors and
  leaves the content behind. A wrapper with `display: contents` costs no layout:

```html
<ng-template #rowTpl let-item>
  <div style="display: contents">
    @if (item.kind === 'head') {
      <app-section-header [row]="item" />
    } @else {
      <app-contact-row [row]="item" />
    }
  </div>
</ng-template>
```

### `infinite` in Angular

Return the promise. The callback fires once per approach and re-arms when the
window leaves the threshold; while a returned promise is pending no further call
is made, which is what stops a slow endpoint being asked again on the next
frame.

```ts
onLoadMore = (ctx: InfiniteLoadContext): Promise<void> =>
  firstValueFrom(this.api.page(ctx.total)).then((page) => {
    this.rows = this.rows.concat(page.items);
    // Angular only. A placeholder that becomes real data at the SAME index
    // (a "loading" row at the tail) will keep rendering as a placeholder:
    // the recycler does not re-run the template for an index it holds, and an
    // embedded view re-evaluates only when asked.
    this.scroller?.refreshRenderedContent();
  });
```

### `ssr` in Angular

Server-render each row inside an element carrying `data-element-index`, wrapped
in one marked `data-cerious-scroll-content`, then set `ssr: { hydrate: true }`.
The engine adopts those rows on its first render instead of clearing them.

The module touches no DOM at import time, so Angular Universal can render the
list. Note that Angular's sanitizer strips `data-*` attributes from an
`[innerHTML]` binding, so a payload supplied that way needs
`bypassSecurityTrustHtml`, or `data-element-index` will not survive to be
matched.

---

## Notes

- **No height estimation.** Rows are committed synchronously via
  `EmbeddedViewRef.detectChanges()` so the engine measures real `offsetHeight`.
  Later size changes are picked up by the engine's built-in `ResizeObserver`.
- **`options` are read at creation.** Changing `options` after init has no
  effect; recreate the host (e.g. with `*ngIf` toggling) to apply new engine
  options.
- **Changing the item count** updates lists/tables in place. Masonry recreates
  its card-count-derived segment layout. Mutating items without changing the count just re-renders the
  content in place (cheap; Angular patches each row, so focus/selection survive)
: it does **not** discard cached heights, so editable grids that produce a new
  `items` array on every edit don't trigger a full viewport re-measure.
- **If every rendered row's height changes at once** (e.g. a density/layout
  switch) the cached heights become stale and rows can misalign until the next
  scroll. Call `recalculate()` on the directive instance right after the change
  to drop the height cache and re-measure. Don't call it on routine edits, a
  single cell edit keeps its row's size, and the engine's built-in
  `ResizeObserver` picks up any incidental resize on its own.

---

## License

Licensed by **Cerious DevTech LLC** under the **MIT License** (see `LICENSE`).

📧 info@ceriousdevtech.com
