/**
 * The 1.2.0 engine options, as seen through the Angular bindings.
 *
 * Most of them are pass-through: the directive hands `ceriousScrollOptions`
 * straight to the engine, so `snap`, `infinite`, `aria` and `direction` need no
 * Angular-side code and these specs exist to keep that true. `sticky` is the
 * exception, because the engine renders the pinned header through the item
 * template and the directive's view-prune pass would otherwise reclaim it.
 */
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CeriousScrollDirective } from './cerious-scroll.directive';

interface Row {
  id: number;
  name: string;
}

const ROW_H = 40;

/** A section header every 25 rows. */
const resolve = (index: number) => Math.floor(index / 25) * 25;

@Component({
  standalone: true,
  imports: [CeriousScrollDirective],
  template: `
    <div
      ceriousScroll
      [ceriousScrollItems]="items"
      [ceriousScrollTotalElements]="total"
      [ceriousScrollGetItem]="getItem"
      [ceriousScrollItemTemplate]="tpl"
      [ceriousScrollOptions]="options"
      [ceriousScrollAutoRender]="false"
      style="width: 400px; height: 400px;"
    ></div>
    <ng-template #tpl let-item let-index="index">
      <div class="row">{{ item?.name }}</div>
    </ng-template>
  `,
})
class Host {
  items: Row[] | null = Array.from({ length: 500 }, (_, i) => ({ id: i, name: `Item ${i}` }));
  total: number | null = null;
  getItem: ((index: number) => Row) | null = null;
  options: Record<string, unknown> = { attachScrollbar: false, autoResize: false };

  @ViewChild(CeriousScrollDirective, { static: true }) directive!: CeriousScrollDirective<Row>;
  @ViewChild('tpl', { static: true, read: TemplateRef }) tpl!: TemplateRef<unknown>;
}

describe('1.2.0 engine options through the Angular binding', () => {
  let origHeight: PropertyDescriptor | undefined;

  /** jsdom-style layout stub: rows (and the pinned header) report a height. */
  beforeEach(() => {
    origHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get(this: HTMLElement) {
        if (this.hasAttribute('data-cerious-sticky')) return ROW_H;
        return this.dataset['elementIndex'] !== undefined ? ROW_H : 0;
      },
    });
    TestBed.configureTestingModule({ imports: [Host] });
  });

  afterEach(() => {
    if (origHeight) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', origHeight);
  });

  function pinned(f: { nativeElement: HTMLElement }): HTMLElement | null {
    return f.nativeElement.querySelector('[data-cerious-sticky]');
  }

  describe('sticky', () => {
    it('keeps the pinned header rendered once its own row leaves the window', () => {
      // The defect this covers: the pinned row is deliberately NOT part of the
      // mounted window, so a view pruned with the rendered rows leaves the
      // header as an empty box.
      const f = TestBed.createComponent(Host);
      f.componentInstance.options = {
        attachScrollbar: false,
        autoResize: false,
        sticky: { resolve },
      };
      f.detectChanges();
      f.componentInstance.directive.render();
      f.detectChanges();

      f.componentInstance.directive.jumpToElement(60);
      f.detectChanges();

      const mounted = Array.from(
        f.nativeElement.querySelectorAll('[data-element-index]'),
      ).map((el) => Number((el as HTMLElement).dataset['elementIndex']));

      expect(pinned(f)!.dataset['stickyIndex']).toBe('50');
      expect(pinned(f)!.textContent!.trim()).toBe('Item 50');
      // The point of the feature: row 50 is pinned while not being mounted.
      expect(mounted).not.toContain(50);
    });

    it('does not let the pinned header steal a mounted row s view', () => {
      // At the top, index 0 is BOTH the pinned header and a real row.
      const f = TestBed.createComponent(Host);
      f.componentInstance.options = {
        attachScrollbar: false,
        autoResize: false,
        sticky: { resolve },
      };
      f.detectChanges();
      f.componentInstance.directive.render();
      f.detectChanges();

      const row0 = f.nativeElement.querySelector('[data-element-index="0"]') as HTMLElement;
      expect(pinned(f)!.textContent!.trim()).toBe('Item 0');
      expect(row0.textContent!.trim()).toBe('Item 0');
      expect(pinned(f)!.contains(row0)).toBe(false);
    });

    it('removes the header when resolve returns null', () => {
      const f = TestBed.createComponent(Host);
      f.componentInstance.options = {
        attachScrollbar: false,
        autoResize: false,
        sticky: { resolve: () => null },
      };
      f.detectChanges();
      f.componentInstance.directive.render();
      f.detectChanges();

      expect(pinned(f)).toBeNull();
    });

    it('applies the configured class to the pinned element', () => {
      const f = TestBed.createComponent(Host);
      f.componentInstance.options = {
        attachScrollbar: false,
        autoResize: false,
        sticky: { resolve, className: 'is-pinned' },
      };
      f.detectChanges();
      f.componentInstance.directive.render();
      f.detectChanges();

      expect(pinned(f)!.classList.contains('is-pinned')).toBe(true);
    });
  });

  describe('aria', () => {
    it('states the real dataset size, not the size of the mounted window', () => {
      const f = TestBed.createComponent(Host);
      f.componentInstance.items = null;
      f.componentInstance.total = 500_000;
      f.componentInstance.getItem = (index: number) => ({ id: index, name: `Item ${index}` });
      f.componentInstance.options = {
        attachScrollbar: false,
        autoResize: false,
        aria: { enabled: true, label: 'People' },
      };
      f.detectChanges();
      f.componentInstance.directive.render();
      f.detectChanges();

      const host = f.nativeElement.querySelector('[role="list"]') as HTMLElement;
      expect(host).toBeTruthy();
      expect(host.getAttribute('aria-label')).toBe('People');

      const rows = Array.from(
        f.nativeElement.querySelectorAll('[data-element-index]'),
      ) as HTMLElement[];
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.length).toBeLessThan(500_000);
      rows.forEach((row) => {
        expect(row.getAttribute('aria-setsize')).toBe('500000');
        expect(row.getAttribute('aria-posinset')).toBe(
          String(Number(row.dataset['elementIndex']) + 1),
        );
      });
    });

    it('stays off unless asked for', () => {
      const f = TestBed.createComponent(Host);
      f.detectChanges();
      f.componentInstance.directive.render();
      f.detectChanges();

      expect(f.nativeElement.querySelector('[role="list"]')).toBeNull();
      expect(f.nativeElement.querySelector('[aria-setsize]')).toBeNull();
    });
  });

  describe('infinite', () => {
    it('asks for more as the end comes into range, and only once per approach', () => {
      const onLoadMore = jasmine.createSpy('onLoadMore');
      const f = TestBed.createComponent(Host);
      f.componentInstance.options = {
        attachScrollbar: false,
        autoResize: false,
        infinite: { onLoadMore, threshold: 20 },
      };
      f.detectChanges();
      f.componentInstance.directive.render();
      f.detectChanges();
      expect(onLoadMore).not.toHaveBeenCalled();

      f.componentInstance.directive.jumpToElement(495);
      f.detectChanges();
      expect(onLoadMore).toHaveBeenCalledTimes(1);
      expect(onLoadMore.calls.mostRecent().args[0]).toEqual(
        jasmine.objectContaining({ direction: 'end', total: 500 }),
      );

      // Still inside the threshold: no second ask.
      f.componentInstance.directive.render();
      f.detectChanges();
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });
  });
});
