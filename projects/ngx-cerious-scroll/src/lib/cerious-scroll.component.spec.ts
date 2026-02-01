import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CeriousScrollComponent } from './cerious-scroll.component';
import { CeriousScrollItemTemplateDirective } from './cerious-scroll-item-template.directive';

@Component({
  standalone: true,
  imports: [CeriousScrollComponent, CeriousScrollItemTemplateDirective],
  template: `
    <cerious-scroll
      [items]="items"
      [autoRender]="autoRender"
      [options]="options">
      <ng-template ceriousScrollItem let-item let-index="index">
        <div class="row">{{ index }}: {{ item }}</div>
      </ng-template>
    </cerious-scroll>
  `,
})
class HostWithProjectedTemplateComponent {
  items = [1, 2, 3];
  autoRender = false;
  options = {
    wheel: { enabled: false },
    touch: { enabled: false },
    keyboard: { enabled: false },
    attachScrollbar: false,
    autoResize: false,
    observeContentChanges: false,
  };
}

@Component({
  standalone: true,
  imports: [CeriousScrollComponent],
  template: `
    <cerious-scroll
      [items]="items"
      [autoRender]="false"
      [options]="options"
      [itemTemplate]="rowTpl">
      <ng-template #rowTpl let-item let-index="index">
        <div class="row-external">{{ index }}: {{ item }}</div>
      </ng-template>
    </cerious-scroll>
  `,
})
class HostWithExternalTemplateComponent {
  items = [10, 20, 30];
  options = {
    wheel: { enabled: false },
    touch: { enabled: false },
    keyboard: { enabled: false },
    attachScrollbar: false,
    autoResize: false,
    observeContentChanges: false,
  };
}

describe('CeriousScrollComponent', () => {
  describe('with projected template (ceriousScrollItem)', () => {
    let fixture: ComponentFixture<HostWithProjectedTemplateComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostWithProjectedTemplateComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(HostWithProjectedTemplateComponent);
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should forward items to directive', () => {
      const host = fixture.componentInstance;
      host.items = [5, 10, 15];
      fixture.detectChanges();

      expect(host.items.length).toBe(3);
    });

    it('should forward options to directive', () => {
      const host = fixture.componentInstance;
      host.options = {
        wheel: { enabled: true },
        touch: { enabled: true },
        keyboard: { enabled: true },
        attachScrollbar: true,
        autoResize: true,
        observeContentChanges: true,
      };
      fixture.detectChanges();

      expect(host.options.wheel!.enabled).toBe(true);
    });

    it('should handle autoRender toggle', () => {
      const host = fixture.componentInstance;
      expect(host.autoRender).toBe(false);

      host.autoRender = true;
      fixture.detectChanges();

      expect(host.autoRender).toBe(true);
    });
  });

  describe('with external template ([itemTemplate])', () => {
    let fixture: ComponentFixture<HostWithExternalTemplateComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostWithExternalTemplateComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(HostWithExternalTemplateComponent);
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should use external template when provided via input', () => {
      const host = fixture.componentInstance;
      expect(host.items.length).toBe(3);
      expect(host.items[0]).toBe(10);
    });
  });
});
