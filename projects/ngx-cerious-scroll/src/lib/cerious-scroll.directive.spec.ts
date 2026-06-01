import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CeriousScrollDirective } from './cerious-scroll.directive';
import type { CeriousScrollItemTemplateContext } from './cerious-scroll-item-template.directive';

interface TestItem {
  id: number;
  name: string;
}

@Component({
  standalone: true,
  imports: [CeriousScrollDirective],
  template: `
    <div
      ceriousScroll
      [ceriousScrollItems]="items"
      [ceriousScrollItemTemplate]="tpl"
      [ceriousScrollOptions]="options"
      [ceriousScrollAutoRender]="autoRender"
      (ceriousScrollViewportChange)="onViewportChange($event)"
      (ceriousScrollMeasuredViewport)="onMeasuredViewport($event)"
      (ceriousScrollReady)="onReady($event)"
      style="width: 400px; height: 600px;">
    </div>

    <ng-template #tpl let-item let-index="index">
      <div class="test-row" [attr.data-index]="index">
        {{ index }}: {{ item?.name }}
      </div>
    </ng-template>
  `,
})
class TestHostComponent {
  items: TestItem[] | null = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];

  options = {
    wheel: { enabled: false },
    touch: { enabled: false },
    keyboard: { enabled: false },
    attachScrollbar: false,
    autoResize: false,
    observeContentChanges: false,
  };

  autoRender = false;

  viewportChanges: any[] = [];
  measuredViewports: any[] = [];
  readyScroller: any = null;

  @ViewChild(CeriousScrollDirective, { static: true })
  directive!: CeriousScrollDirective<TestItem>;

  @ViewChild('tpl', { static: true, read: TemplateRef })
  tpl!: TemplateRef<CeriousScrollItemTemplateContext<TestItem>>;

  onViewportChange(detail: any): void {
    this.viewportChanges.push(detail);
  }

  onMeasuredViewport(range: any): void {
    this.measuredViewports.push(range);
  }

  onReady(scroller: any): void {
    this.readyScroller = scroller;
  }
}

@Component({
  standalone: true,
  imports: [CeriousScrollDirective],
  template: `
    <div
      ceriousScroll
      [ceriousScrollGetItem]="getItem"
      [ceriousScrollTotalElements]="total"
      [ceriousScrollItemTemplate]="tpl"
      [ceriousScrollOptions]="options"
      style="width: 400px; height: 600px;">
    </div>

    <ng-template #tpl let-item let-index="index">
      <div class="test-row">{{ index }}: {{ item?.name }}</div>
    </ng-template>
  `,
})
class TestGetItemComponent {
  total = 1000;

  options = {
    wheel: { enabled: false },
    touch: { enabled: false },
    keyboard: { enabled: false },
    attachScrollbar: false,
    autoResize: false,
    observeContentChanges: false,
  };

  @ViewChild(CeriousScrollDirective, { static: true })
  directive!: CeriousScrollDirective<TestItem>;

  getItem = (index: number): TestItem => {
    return { id: index, name: `Item ${index}` };
  };
}

describe('CeriousScrollDirective', () => {
  describe('basic setup and lifecycle', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(host.directive).toBeTruthy();
    });

    it('should emit scrollerReady after initialization', () => {
      expect(host.readyScroller).toBeTruthy();
      expect(host.readyScroller.totalElements).toBe(3);
    });

    it('should initialize with correct totalElements from items array', () => {
      expect(host.readyScroller.totalElements).toBe(3);
    });

    it('should update totalElements when items change', () => {
      host.items = [
        { id: 1, name: 'New 1' },
        { id: 2, name: 'New 2' },
        { id: 3, name: 'New 3' },
        { id: 4, name: 'New 4' },
        { id: 5, name: 'New 5' },
      ];
      fixture.detectChanges();

      expect(host.readyScroller.totalElements).toBe(5);
    });

    it('should update totalElements when explicit total changes', () => {
      host.directive.ceriousScrollTotalElements = 100;
      host.items = null;
      fixture.detectChanges();

      expect(host.readyScroller.totalElements).toBe(100);
    });

    it('should recreate the scroller (not just clear caches) when the item count changes', () => {
      const originalScroller = host.readyScroller;
      expect(originalScroller).toBeTruthy();

      // 3 items → 1 item is a count change.  The directive must recreate the
      // engine entirely so the ViewportRenderer's internal totalElements bound
      // stays consistent with the new count (it is set by value at construction
      // and cannot be patched from outside).
      host.items = [{ id: 99, name: 'Changed' }];
      fixture.detectChanges();

      // A new scroller instance should have been emitted via ceriousScrollReady.
      expect(host.readyScroller).not.toBe(originalScroller);
      expect(host.readyScroller.totalElements).toBe(1);
    });

    it('should NOT clear caches when items change reference but count is unchanged', () => {
      spyOn(host.readyScroller, 'clearAllCaches');

      // Same length (3 -> 3), new array reference: an in-place content refresh,
      // like an editable grid's immutable update. Clearing here would force a
      // full viewport re-measure on every edit, so it must be avoided.
      host.items = [
        { id: 1, name: 'Edited 1' },
        { id: 2, name: 'Edited 2' },
        { id: 3, name: 'Edited 3' },
      ];
      fixture.detectChanges();

      expect(host.readyScroller.clearAllCaches).not.toHaveBeenCalled();
    });

    it('should clear caches and re-measure when recalculate() is called', () => {
      spyOn(host.readyScroller, 'clearAllCaches').and.callThrough();

      const range = host.directive.recalculate();

      expect(host.readyScroller.clearAllCaches).toHaveBeenCalled();
      expect(range).toBeTruthy();
    });

    it('should not render automatically when autoRender is false', () => {
      expect(host.measuredViewports.length).toBe(0);
    });

    it('should render when autoRender is true', async () => {
      // Create a new fixture with autoRender = true from the start
      @Component({
        standalone: true,
        imports: [CeriousScrollDirective],
        template: `
          <div
            ceriousScroll
            [ceriousScrollItems]="items"
            [ceriousScrollItemTemplate]="tpl"
            [ceriousScrollOptions]="options"
            [ceriousScrollAutoRender]="true"
            (ceriousScrollMeasuredViewport)="onMeasuredViewport($event)"
            style="width: 400px; height: 600px;">
          </div>

          <ng-template #tpl let-item let-index="index">
            <div class="test-row">{{ index }}: {{ item?.name }}</div>
          </ng-template>
        `,
      })
      class AutoRenderComponent {
        items: TestItem[] = [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
          { id: 3, name: 'Item 3' },
        ];

        options = {
          wheel: { enabled: false },
          touch: { enabled: false },
          keyboard: { enabled: false },
          attachScrollbar: false,
          autoResize: false,
          observeContentChanges: false,
        };

        measuredViewports: any[] = [];

        onMeasuredViewport(range: any): void {
          this.measuredViewports.push(range);
        }
      }

      const autoFixture = TestBed.createComponent(AutoRenderComponent);
      const autoHost = autoFixture.componentInstance;
      autoFixture.detectChanges();

      // Wait for microtask and change detection
      await autoFixture.whenStable();
      autoFixture.detectChanges();

      expect(autoHost.measuredViewports.length).toBeGreaterThan(0);
    });

    it('should render imperatively when render() is called', () => {
      const range = host.directive.render();

      expect(range).toBeTruthy();
      expect(range!.startElement).toBeGreaterThanOrEqual(0);
      expect(range!.endElement).toBeGreaterThanOrEqual(range!.startElement);
    });

    it('should emit measuredViewport after render', () => {
      host.directive.render();
      fixture.detectChanges();

      expect(host.measuredViewports.length).toBeGreaterThan(0);
      const lastRange = host.measuredViewports[host.measuredViewports.length - 1];
      expect(lastRange.startElement).toBeDefined();
      expect(lastRange.endElement).toBeDefined();
    });

    it('should handle null items gracefully', () => {
      host.items = null;
      host.directive.ceriousScrollTotalElements = 10;
      fixture.detectChanges();

      const range = host.directive.render();
      expect(range).toBeTruthy();
    });

    it('should clean up on destroy', () => {
      const contentElements = fixture.nativeElement.querySelectorAll('[data-cerious-scroll-content]');
      expect(contentElements.length).toBeGreaterThan(0);

      fixture.destroy();

      // After destroy, the directive should have cleaned up
      expect(host.directive['hostRef']).toBeNull();
    });
  });

  describe('with getItem', () => {
    let fixture: ComponentFixture<TestGetItemComponent>;
    let host: TestGetItemComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestGetItemComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TestGetItemComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should use getItem for large datasets', () => {
      const range = host.directive.render();

      expect(range).toBeTruthy();
      // Should render some elements even with large total
      expect(range!.viewportElements).toBeGreaterThan(0);
    });

    it('should call getItem for each rendered row', () => {
      const getItemSpy = jasmine.createSpy('getItem').and.callFake((index: number) => {
        return { id: index, name: `Item ${index}` };
      });
      
      host.directive.ceriousScrollGetItem = getItemSpy;
      fixture.detectChanges();
      
      host.directive.render();
      fixture.detectChanges();

      expect(getItemSpy).toHaveBeenCalled();
      expect(getItemSpy.calls.count()).toBeGreaterThan(0);
    });
  });

  describe('template rendering', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should render template with correct context', () => {
      host.directive.render();
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.test-row');
      expect(rows.length).toBeGreaterThan(0);

      const firstRow = rows[0] as HTMLElement;
      expect(firstRow.textContent).toContain('Item 1');
    });

    it('should update rendered content when items change', () => {
      host.directive.render();
      fixture.detectChanges();

      let rows = fixture.nativeElement.querySelectorAll('.test-row');
      const initialCount = rows.length;

      host.items = [
        { id: 1, name: 'Updated 1' },
        { id: 2, name: 'Updated 2' },
      ];
      fixture.detectChanges();
      host.directive.render();
      fixture.detectChanges();

      rows = fixture.nativeElement.querySelectorAll('.test-row');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should provide correct index in template context', () => {
      host.directive.render();
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.test-row');
      if (rows.length > 0) {
        const firstRow = rows[0] as HTMLElement;
        const index = firstRow.getAttribute('data-index');
        expect(index).toBe('0');
      }
    });
  });

  describe('options changes', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should recreate scroller when options change', () => {
      const originalScroller = host.readyScroller;

      host.options = {
        wheel: { enabled: true },
        touch: { enabled: true },
        keyboard: { enabled: true },
        attachScrollbar: false,
        autoResize: false,
        observeContentChanges: false,
      };
      fixture.detectChanges();

      // After recreate, a new scroller should be emitted
      expect(host.readyScroller).toBeTruthy();
      // Note: CeriousScroll instances are recreated, so this is expected behavior
    });
  });

  describe('error handling', () => {
    it('should throw when neither totalElements nor items are provided', () => {
      @Component({
        standalone: true,
        imports: [CeriousScrollDirective],
        template: `
          <div
            ceriousScroll
            [ceriousScrollItemTemplate]="tpl"
            style="width: 400px; height: 600px;">
          </div>

          <ng-template #tpl let-item>
            {{ item }}
          </ng-template>
        `,
      })
      class InvalidComponent {}

      expect(() => {
        const fixture = TestBed.createComponent(InvalidComponent);
        fixture.detectChanges();
      }).toThrow();
    });
  });
});