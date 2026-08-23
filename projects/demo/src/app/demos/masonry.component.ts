import { Component, ViewChild } from '@angular/core';
import { CeriousScrollDirective, type CeriousScrollOptions } from 'ngx-cerious-scroll';
import { rand } from '../lib/random';

const RATIOS = [3 / 4, 4 / 3, 1, 9 / 16, 16 / 9, 2 / 3] as const;
const ITEM_COUNTS = [1_000, 50_000, 200_000, 1_000_000] as const;

@Component({
  selector: 'demo-masonry',
  standalone: true,
  imports: [CeriousScrollDirective],
  styleUrl: './masonry.css',
  template: `
    <div class="demo-page">
      <div class="demo-page__header"><h1>🧱 Masonry · canonical heights</h1><p>Angular templates flow into responsive columns from a pure height oracle, giving every card a reproducible position.</p></div>
      <div class="demo-toolbar">
        <label for="masonry-items">Items</label>
        <select id="masonry-items" [value]="total" (change)="setTotal($any($event.target).value)">
          @for (count of itemCounts; track count) { <option [value]="count">{{ count.toLocaleString() }}</option> }
        </select>
        <input #jump type="number" value="123456" />
        <button type="button" (click)="go(jump.value)">Go</button>
        <button type="button" (click)="scroller?.scrollToPercentage(0)">Top</button>
        <button type="button" (click)="scroller?.scrollToPercentage(100)">End</button>
      </div>
      <div class="demo-scroll masonry-scroll" ceriousScroll [ceriousScrollTotalElements]="total" [ceriousScrollGetItem]="getItem" [ceriousScrollItemTemplate]="card" [ceriousScrollOptions]="options"></div>
      <ng-template #card let-index>
        <div class="masonry-card masonry-card--media">
          <span class="masonry-card__fill" [style.background]="color(index)"></span>
          <span class="masonry-card__label">Angular · {{ index.toLocaleString() }}</span>
        </div>
      </ng-template>
      <div class="demo-footer"><span>Total: <strong>{{ total.toLocaleString() }}</strong></span><span>Determinism: <strong>canonical</strong></span></div>
    </div>
  `,
})
export class MasonryComponent {
  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<number>;
  readonly itemCounts = ITEM_COUNTS;
  total = 200_000;
  readonly getItem = (index: number) => index;
  readonly options: CeriousScrollOptions = {
    layout: 'masonry',
    wheel: { smooth: true, notchThresholdPx: Infinity },
    masonry: {
      getItemHeight: (index, width) => Math.round(width / RATIOS[Math.floor(rand(index, 1) * RATIOS.length)]) + 44,
      gap: 14,
      targetColumnWidth: 260,
      segmentSize: 500,
    },
  };
  color(index: number): string {
    const hue = Math.floor(rand(index, 2) * 360);
    return `linear-gradient(160deg,hsl(${hue} 62% 58%),hsl(${(hue + 38) % 360} 62% 44%))`;
  }
  setTotal(value: string): void { this.total = Number.parseInt(value, 10); }
  go(value: string): void {
    const index = Number.parseInt(value, 10);
    if (Number.isFinite(index)) this.scroller?.jumpToItem(Math.max(0, Math.min(this.total - 1, index)));
  }
}
