import { Component, OnDestroy, OnInit } from '@angular/core';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import {
  FIN_TOTAL,
  initialPrices,
  makeStock,
  sparkPoints,
  sparkSeries,
  tickPrices,
} from './finance.data';

import { DemoIconComponent } from '../demo-icon.component';
import { DemoDocsComponent } from '../demo-docs.component';

@Component({
  selector: 'demo-finance',
  standalone: true,
  imports: [CeriousScrollDirective, DemoIconComponent, DemoDocsComponent],
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1><demo-icon name="finance" />Live Market Ticker</h1>
        <p>{{ total.toLocaleString() }} symbols with streaming prices and sparklines.</p>
      </div>

      <demo-docs
        [feature]="DOCS_FEATURE"
        [docs]="DOCS_LINK"
        [introHtml]="DOCS_INTRO"
        [notesHtml]="DOCS_NOTES"
        [code]="DOCS_CODE"
      />

      <div class="demo-toolbar">
        <button type="button" [class.is-active]="live" (click)="live = !live">
          {{ live ? '⏸ Pause stream' : '▶ Resume stream' }}
        </button>
        <span class="stat">updates every 1.2s</span>
      </div>

      <div
        class="demo-scroll fin-scroll"
        ceriousScroll
        [ceriousScrollTotalElements]="total"
        [ceriousScrollGetItem]="getItem"
        [ceriousScrollItemTemplate]="rowTpl"
      ></div>

      <ng-template #rowTpl let-i="index">
        <div class="fin-row">
          <span class="fin-sym">{{ stock(i).symbol }}</span>
          <span class="fin-name">{{ stock(i).name }}<small>{{ stock(i).sector }}</small></span>
          <svg class="fin-spark" [attr.width]="110" [attr.height]="28">
            <polyline
              [attr.points]="spark(i)"
              fill="none"
              [attr.stroke]="pct(i) >= 0 ? '#3fb950' : '#f85149'"
              [attr.stroke-width]="1.5"
            />
          </svg>
          <span class="fin-price">{{ '$' + prices[i].toFixed(2) }}</span>
          <span class="fin-change" [class]="pct(i) >= 0 ? 'fin-up' : 'fin-down'">
            {{ pct(i) >= 0 ? '▲' : '▼' }} {{ abs(pct(i)).toFixed(2) }}%
          </span>
        </div>
      </ng-template>
    </div>
  `,
})
export class FinanceComponent implements OnInit, OnDestroy {
  /** 'How to build this' panel. Prose shared with the vanilla demos. */
  readonly DOCS_FEATURE = "High-frequency updates against a moving window";
  readonly DOCS_LINK = "https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md";
  readonly DOCS_INTRO = "A ticker updates far more often than it scrolls, and almost every update is for a row that is not on screen. The efficient shape is therefore the inverse of the usual one: write incoming prices into your data unconditionally, and repaint only what is mounted, only as often as a person can see. <code>refresh()</code> re-runs the renderer for the mounted rows, so driving it from a timer decouples your paint rate from your message rate entirely.";
  readonly DOCS_NOTES = [
    "Do not call <code>refresh()</code> per message. Coalesce on a timer or a rAF; the mounted window is what costs, not the message.",
    "Flash-on-change effects should be driven from your data (compare to the previous value), not from a CSS animation on a recycled node.",
    "Sparklines are cheapest as an inline SVG path built from a fixed-length ring buffer per symbol.",
    "Sorting by a live value means indices change constantly: key any selection on the symbol id.",
  ];
  readonly DOCS_CODE = `// A tick changes prices, not the row count. Heights never change, so
// nothing is re-measured.
ngOnInit(): void {
  this.timer = setInterval(() => { this.quotes = tick(this.quotes); }, 250);
}`;

  readonly total = FIN_TOTAL;
  protected readonly stock = makeStock;
  protected readonly spark = (i: number) => sparkPoints(sparkSeries(i), 110, 28);

  prices: number[] = initialPrices();
  live = true;
  readonly getItem = (i: number): number => i;

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.timer = setInterval(() => {
      if (this.live) this.prices = tickPrices(this.prices);
    }, 1200);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  pct(i: number): number {
    const base = makeStock(i).base;
    return ((this.prices[i] - base) / base) * 100;
  }

  abs(n: number): number {
    return Math.abs(n);
  }
}
