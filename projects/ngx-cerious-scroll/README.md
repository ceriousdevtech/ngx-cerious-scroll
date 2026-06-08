# @ceriousdevtech/ngx-cerious-scroll

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://ceriousdevtech.github.io/ngx-cerious-scroll/)

Angular wrapper for [@ceriousdevtech/cerious-scroll](https://www.npmjs.com/package/@ceriousdevtech/cerious-scroll), providing high-performance virtual scrolling with variable row heights for Angular applications.

## Features

- 🚀 **High Performance** - Handles millions of items with smooth scrolling
- 📏 **Variable Heights** - Full support for dynamic and variable row heights
- 🧮 **Native Table Layout** - Opt-in `layout: 'table'` renders real `<tr>`/`<td>` rows with a frozen header and auto-sized columns (see [Table Layout](#table-layout))
- 🎯 **Angular Integration** - Seamless integration with Angular templates and change detection
- 🎨 **Flexible Templates** - Use Angular templates with full data binding
- 📦 **Standalone Components** - Built with Angular standalone components
- 🔄 **Reactive** - RxJS observables for viewport change events
- ⚡ **Auto Render** - Automatic rendering on scroll or manual control

## Installation

```bash
npm install @ceriousdevtech/ngx-cerious-scroll @ceriousdevtech/cerious-scroll
```

## Usage

### Component API

The simplest way to use virtual scrolling with the `<cerious-scroll>` component:

```typescript
import { Component } from '@angular/core';
import { CeriousScrollComponent } from '@ceriousdevtech/ngx-cerious-scroll';

@Component({
  selector: 'app-my-list',
  standalone: true,
  imports: [CeriousScrollComponent],
  template: `
    <cerious-scroll
      [items]="items"
      [options]="scrollOptions"
      (viewportChange)="onViewportChange($event)">
      <ng-template ceriousScrollItem let-item let-index="index">
        <div class="row">
          {{ index }}: {{ item.title }}
        </div>
      </ng-template>
    </cerious-scroll>
  `,
  styles: [`
    cerious-scroll {
      height: 600px;
      display: block;
    }
    .row {
      padding: 16px;
      border-bottom: 1px solid #eee;
    }
  `]
})
export class MyListComponent {
  items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    title: `Item ${i}`
  }));

  scrollOptions = {
    wheel: { enabled: true },
    touch: { enabled: true },
    keyboard: { enabled: true },
  };

  onViewportChange(detail: any) {
    console.log('Viewport changed:', detail);
  }
}
```

### Directive API

For more control, use the `[ceriousScroll]` directive on any element:

```typescript
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CeriousScrollDirective } from '@ceriousdevtech/ngx-cerious-scroll';

@Component({
  selector: 'app-advanced-list',
  standalone: true,
  imports: [CeriousScrollDirective],
  template: `
    <div
      ceriousScroll
      [ceriousScrollItems]="items"
      [ceriousScrollItemTemplate]="rowTemplate"
      [ceriousScrollOptions]="options"
      [ceriousScrollAutoRender]="true"
      (ceriousScrollViewportChange)="onViewportChange($event)"
      (ceriousScrollMeasuredViewport)="onMeasured($event)"
      (ceriousScrollReady)="onReady($event)"
      class="viewport">
    </div>

    <ng-template #rowTemplate let-item let-index="index">
      <div class="row" [style.height.px]="getRowHeight(index)">
        <strong>#{{ index }}</strong>: {{ item.name }}
      </div>
    </ng-template>
  `,
  styles: [`
    .viewport {
      height: 600px;
      overflow: hidden;
    }
  `]
})
export class AdvancedListComponent {
  items = Array.from({ length: 50000 }, (_, i) => ({
    id: i,
    name: `Row ${i}`
  }));

  options = {
    wheel: { enabled: true },
    touch: { enabled: true },
    keyboard: { enabled: true },
  };

  getRowHeight(index: number): number {
    // Variable row heights
    return 40 + (index % 5) * 10;
  }

  onViewportChange(detail: any) {
    console.log('Scroll position:', detail);
  }

  onMeasured(range: any) {
    console.log('Rendered range:', range);
  }

  onReady(scroller: any) {
    console.log('Scroller ready:', scroller);
  }
}
```

### Using with Large Datasets (getItem)

For very large datasets, use `getItem` instead of passing the entire array:

```typescript
import { Component } from '@angular/core';
import { CeriousScrollDirective } from '@ceriousdevtech/ngx-cerious-scroll';

@Component({
  selector: 'app-large-list',
  standalone: true,
  imports: [CeriousScrollDirective],
  template: `
    <div
      ceriousScroll
      [ceriousScrollTotalElements]="1000000"
      [ceriousScrollGetItem]="getItem"
      [ceriousScrollItemTemplate]="rowTpl"
      [ceriousScrollOptions]="options"
      class="viewport">
    </div>

    <ng-template #rowTpl let-item let-index="index">
      <div class="row">{{ item.value }}</div>
    </ng-template>
  `,
  styles: [`
    .viewport { height: 600px; }
    .row { padding: 12px; }
  `]
})
export class LargeListComponent {
  options = {
    wheel: { enabled: true },
    touch: { enabled: true },
    keyboard: { enabled: true },
  };

  getItem = (index: number) => {
    return {
      value: `Dynamic item ${index}`
    };
  };
}
```

## API Reference

### Component: `<cerious-scroll>`

#### Inputs
- `items: any[]` - Array of items to render
- `totalElements: number` - Optional explicit total count (defaults to items.length)
- `itemTemplate: TemplateRef` - Template for rendering each item
- `headerTemplate: TemplateRef` - Table mode only: `<tr>` of `<th>`s rendered into the engine's `<thead>` (see [Table Layout](#table-layout))
- `options: CeriousScrollOptions` - Configuration options
- `autoRender: boolean` - Auto-render on scroll (default: true)

#### Outputs
- `viewportChange: EventEmitter<CeriousViewportChangeDetail>` - Emits on scroll
- `measuredViewport: EventEmitter<MeasuredViewportRange>` - Emits after each render
- `scrollerReady: EventEmitter<CeriousScroll>` - Emits when scroller is initialized

### Directive: `[ceriousScroll]`

#### Inputs
- `ceriousScrollItems: any[]` - Array of items
- `ceriousScrollTotalElements: number` - Total element count
- `ceriousScrollGetItem: (index: number) => any` - Function to retrieve item by index
- `ceriousScrollItemTemplate: TemplateRef` - Template for rendering
- `ceriousScrollHeaderTemplate: TemplateRef` - Table mode only: header `<tr>` rendered into the engine's `<thead>` (see [Table Layout](#table-layout))
- `ceriousScrollOptions: CeriousScrollOptions` - Configuration options
- `ceriousScrollAutoRender: boolean` - Auto-render on scroll (default: true)

#### Outputs
- `ceriousScrollViewportChange: EventEmitter<CeriousViewportChangeDetail>` - Scroll events
- `ceriousScrollMeasuredViewport: EventEmitter<MeasuredViewportRange>` - Render metrics
- `ceriousScrollReady: EventEmitter<CeriousScroll>` - Scroller instance

### Methods

Both the component and directive expose:

| Method | Description |
|--------|-------------|
| `render()` | Trigger a manual render pass. |
| `recalculate()` | Discard all cached row heights and re-measure the viewport. |

**When to call `recalculate()`:** only when the heights of rows you've *already
rendered* change without their indices changing — e.g. a global font/density
switch, or swapping every row to a different layout. It forces a synchronous
re-measure (one `offsetHeight` read per visible row).

**Editable rows / immutable updates:** changing `items` to a new reference with
the **same length** refreshes the visible rows' content *in place* — focus,
caret, and open dropdowns are preserved — and does **not** clear cached heights.
So an editable grid that produces a new `items` array on every keystroke won't
trigger a full viewport re-measure each time. Changing the item **count** does
clear caches and re-measure. For an incidental single-row height change, the
engine's `ResizeObserver` (`observeContentChanges`, on by default) updates that
row's cached height on its own — no manual call needed.

### Template Context

Templates receive the following context:

```typescript
{
  $implicit: TItem;  // The item (default binding)
  item: TItem;       // The item (named binding)
  index: number;     // Row index
}
```

Usage in templates:
```html
<ng-template ceriousScrollItem let-item let-index="index">
  {{ index }}: {{ item.name }}
</ng-template>
```

## Table Layout

Pass `[ceriousScrollOptions]="{ layout: 'table' }"` to render **real `<table>` / `<tr>` / `<td>` rows** with a frozen header and native column alignment — while keeping O(1) virtualization. The row template returns the row's `<td>` cells; `[ceriousScrollHeaderTemplate]` provides the `<thead>` row (it updates via change detection):

```html
<div
  class="grid"
  ceriousScroll
  [ceriousScrollTotalElements]="100000"
  [ceriousScrollGetItem]="getItem"
  [ceriousScrollItemTemplate]="rowTpl"
  [ceriousScrollHeaderTemplate]="headerTpl"
  [ceriousScrollOptions]="{ layout: 'table', table: { tableClassName: 'grid-table', autoSizeColumns: true } }"
></div>

<ng-template #headerTpl>
  <tr>
    @for (c of columns; track c.key) { <th>{{ c.label }}</th> }
  </tr>
</ng-template>

<!-- Row template root nodes must be <td>s (no structural directive at the root). -->
<ng-template #rowTpl let-index>
  <td>{{ row(index).id }}</td>
  <td>{{ row(index).name }}</td>
  <td>{{ row(index).email }}</td>
</ng-template>
```

`<cerious-scroll>` exposes the same inputs (`[headerTemplate]`, `<ng-template ceriousScrollItem>`).

- The header template renders into the engine's `<thead>` (same `<table>` as the rows → native column alignment; the header is frozen because only the `<tbody>` transforms).
- The row template's **root nodes must be `<td>`s** — a structural directive at the root would hide the cells from the directive's recycle re-append.
- **`table.autoSizeColumns: true`** measures column widths once from the first window and pins them: auto-sized but stable (no scroll jitter, no manual widths). Or pass `table.columnWidths`. Variable row heights are measured per row, same as the default mode.
- **CSS:** use `border-collapse: separate` (collapsed borders are painted by the untransformed `<table>` and would not move with the rows), and give the `<thead>` an opaque background.

## Options

Configure scrolling behavior with `CeriousScrollOptions`:

```typescript
const options = {
  wheel: {
    enabled: true,
    emitViewportChangeEvent: true,
    coalesceViewportChangeEvent: true
  },
  touch: { enabled: true },
  keyboard: { enabled: true },
  attachScrollbar: true,
  autoResize: true,
  observeContentChanges: true
};
```

## License

Licensed under the MIT License.

See [LICENSE-MIT](./LICENSE-MIT) for details.

## Related Packages

- [@ceriousdevtech/cerious-scroll](https://www.npmjs.com/package/@ceriousdevtech/cerious-scroll) - Core virtual scrolling engine

## Support

For issues and feature requests, please visit the [GitHub repository](https://github.com/ceriousdevtech/ngx-cerious-scroll).
