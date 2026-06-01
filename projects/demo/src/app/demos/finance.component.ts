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

@Component({
  selector: 'demo-finance',
  standalone: true,
  imports: [CeriousScrollDirective],
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1>📈 Live Market Ticker</h1>
        <p>{{ total.toLocaleString() }} symbols with streaming prices and sparklines.</p>
      </div>

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
