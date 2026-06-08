import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  TemplateRef,
} from '@angular/core';

import { CeriousScrollDirective } from './cerious-scroll.directive';
import {
  CeriousScrollItemTemplateDirective,
  type CeriousScrollItemTemplateContext,
} from './cerious-scroll-item-template.directive';

@Component({
  selector: 'cerious-scroll',
  standalone: true,
  imports: [],
  hostDirectives: [
    {
      directive: CeriousScrollDirective,
      inputs: [
        'ceriousScrollTotalElements: totalElements',
        'ceriousScrollItems: items',
        'ceriousScrollGetItem: getItem',
        'ceriousScrollItemTemplate: itemTemplate',
        'ceriousScrollHeaderTemplate: headerTemplate',
        'ceriousScrollOptions: options',
        'ceriousScrollAutoRender: autoRender',
      ],
      outputs: [
        'ceriousScrollViewportChange: viewportChange',
        'ceriousScrollMeasuredViewport: measuredViewport',
        'ceriousScrollReady: scrollerReady',
      ],
    },
  ],
  template: `<ng-content />`,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CeriousScrollComponent<TItem = unknown> implements AfterContentInit {
  /** Optional convenience template marker: <ng-template ceriousScrollItem let-item let-index="index">...</ng-template> */
  @ContentChild(CeriousScrollItemTemplateDirective)
  private readonly projectedItemTemplate?: CeriousScrollItemTemplateDirective<TItem>;

  constructor(private readonly ceriousScroll: CeriousScrollDirective<TItem>) {}

  ngAfterContentInit(): void {
    if (this.ceriousScroll.ceriousScrollItemTemplate) return;
    if (!this.projectedItemTemplate) return;

    this.ceriousScroll.ceriousScrollItemTemplate =
      this.projectedItemTemplate.templateRef as TemplateRef<CeriousScrollItemTemplateContext<TItem>>;

    if (this.ceriousScroll.ceriousScrollAutoRender) {
      queueMicrotask(() => this.ceriousScroll.render());
    }
  }
}
