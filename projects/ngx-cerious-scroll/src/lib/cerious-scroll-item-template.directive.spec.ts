import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CeriousScrollItemTemplateDirective } from './cerious-scroll-item-template.directive';

@Component({
  standalone: true,
  imports: [CeriousScrollItemTemplateDirective],
  template: `
    <ng-template ceriousScrollItem let-item let-index="index">
      <div>{{ index }}: {{ item?.name }}</div>
    </ng-template>
  `,
})
class TestComponent {
  @ViewChild(CeriousScrollItemTemplateDirective, { static: true })
  directive!: CeriousScrollItemTemplateDirective<{ name: string }>;
}

describe('CeriousScrollItemTemplateDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component.directive).toBeTruthy();
  });

  it('should expose templateRef', () => {
    expect(component.directive.templateRef).toBeTruthy();
  });

  it('should have correct template type', () => {
    const templateRef = component.directive.templateRef;
    expect(templateRef).toBeTruthy();

    // Create an embedded view to verify the template works
    const view = templateRef.createEmbeddedView({
      $implicit: { name: 'Test Item' },
      item: { name: 'Test Item' },
      index: 42,
    });

    expect(view).toBeTruthy();
    expect(view.rootNodes.length).toBeGreaterThan(0);

    view.destroy();
  });

  it('should render template with correct context', () => {
    const templateRef = component.directive.templateRef;
    const view = templateRef.createEmbeddedView({
      $implicit: { name: 'My Item' },
      item: { name: 'My Item' },
      index: 10,
    });

    view.detectChanges();

    const element = view.rootNodes[0] as HTMLElement;
    expect(element.textContent).toContain('10: My Item');

    view.destroy();
  });
});