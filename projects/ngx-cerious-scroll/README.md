# @ceriousdevtech/ngx-cerious-scroll

Angular wrapper for [@ceriousdevtech/cerious-scroll](https://www.npmjs.com/package/@ceriousdevtech/cerious-scroll), providing high-performance virtual scrolling with variable row heights for Angular applications.

## Features

- 🚀 **High Performance** - Handles millions of items with smooth scrolling
- 📏 **Variable Heights** - Full support for dynamic and variable row heights
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
- `ceriousScrollOptions: CeriousScrollOptions` - Configuration options
- `ceriousScrollAutoRender: boolean` - Auto-render on scroll (default: true)

#### Outputs
- `ceriousScrollViewportChange: EventEmitter<CeriousViewportChangeDetail>` - Scroll events
- `ceriousScrollMeasuredViewport: EventEmitter<MeasuredViewportRange>` - Render metrics
- `ceriousScrollReady: EventEmitter<CeriousScroll>` - Scroller instance

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

Dual-licensed under MIT OR LicenseRef-CeriousScroll-Commercial.

See [LICENSE-MIT](./LICENSE-MIT) and [LICENSE-COMMERCIAL](./LICENSE-COMMERCIAL) for details.

## Related Packages

- [@ceriousdevtech/cerious-scroll](https://www.npmjs.com/package/@ceriousdevtech/cerious-scroll) - Core virtual scrolling engine

## Support

For issues and feature requests, please visit the [GitHub repository](https://github.com/ceriousdevtech/ngx-cerious-scroll).
