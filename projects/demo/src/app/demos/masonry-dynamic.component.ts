import { Component, ViewChild } from '@angular/core';
import { CeriousScrollDirective, type CeriousScrollOptions } from 'ngx-cerious-scroll';
import { rand, randInt } from '../lib/random';

const WORDS = 'virtual scroll masonry column height measure viewport segment frontier anchor gutter card render engine layout dataset pixel budget cache'.split(' ');
const ITEM_COUNTS = [1_000, 50_000, 200_000, 1_000_000] as const;

@Component({
  selector: 'demo-masonry-dynamic',
  standalone: true,
  imports: [CeriousScrollDirective],
  styleUrl: './masonry.css',
  template: `
    <div class="demo-page">
      <div class="demo-page__header"><h1>🪜 Masonry · dynamic heights</h1><p>No height oracle: Angular creates a short-lived embedded view for measurement before the core places each uncached card.</p></div>
      <div class="demo-toolbar">
        <label for="masonry-dynamic-items">Items</label>
        <select id="masonry-dynamic-items" [value]="total" (change)="setTotal($any($event.target).value)">
          @for (count of itemCounts; track count) { <option [value]="count">{{ count.toLocaleString() }}</option> }
        </select>
        <input #jump type="number" value="25000" />
        <button type="button" (click)="go(jump.value)">Go</button>
        <button type="button" (click)="scroller?.scrollToPercentage(0)">Top</button>
        <button type="button" (click)="scroller?.scrollToPercentage(100)">End</button>
      </div>
      <div class="demo-scroll masonry-scroll" ceriousScroll [ceriousScrollTotalElements]="total" [ceriousScrollGetItem]="getItem" [ceriousScrollItemTemplate]="card" [ceriousScrollOptions]="options"></div>
      <ng-template #card let-index>
        <article class="masonry-card masonry-card--dynamic">
          <div class="masonry-card__kind"><span class="masonry-card__id">{{ index.toLocaleString() }}</span>Angular card</div>
          <p>{{ text(index) }}</p>
          @if (bandHeight(index); as height) {
            <div class="masonry-card__band" [style.height.px]="height" [style.background]="bandColor(index)"></div>
          }
        </article>
      </ng-template>
      <div class="demo-footer"><span>Total: <strong>{{ total.toLocaleString() }}</strong></span><span>Determinism: <strong>local</strong></span></div>
    </div>
  `,
})
export class MasonryDynamicComponent {
  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<number>;
  readonly itemCounts = ITEM_COUNTS;
  total = 50_000;
  readonly getItem = (index: number) => index;
  readonly options: CeriousScrollOptions = {
    layout: 'masonry',
    wheel: { smooth: true, notchThresholdPx: Infinity },
    masonry: { estimatedItemHeight: 260, gap: 14, targetColumnWidth: 300 },
  };
  text(index: number): string {
    const count = [5, 14, 32, 58][index % 4];
    return Array.from({ length: count }, (_, offset) => WORDS[Math.floor(rand(index * 31 + offset, 11) * WORDS.length)]).join(' ');
  }
  bandHeight(index: number): number { return index % 7 === 0 ? randInt(index, 50, 230, 8) : 0; }
  bandColor(index: number): string {
    const hue = Math.floor(rand(index, 9) * 360);
    return `linear-gradient(160deg,hsl(${hue} 60% 55%),hsl(${(hue + 40) % 360} 60% 42%))`;
  }
  setTotal(value: string): void { this.total = Number.parseInt(value, 10); }
  go(value: string): void {
    const index = Number.parseInt(value, 10);
    if (Number.isFinite(index)) this.scroller?.jumpToItem(Math.max(0, Math.min(this.total - 1, index)));
  }
}
