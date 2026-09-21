import { Component, ViewChild } from '@angular/core';
import { CeriousScrollDirective, type CeriousScrollOptions } from 'ngx-cerious-scroll';
import { rand } from '../lib/random';

import { DemoIconComponent } from '../demo-icon.component';
import { DemoDocsComponent } from '../demo-docs.component';

const RATIOS = [3 / 4, 4 / 3, 1, 9 / 16, 16 / 9, 2 / 3] as const;
const ITEM_COUNTS = [1_000, 50_000, 200_000, 1_000_000] as const;

@Component({
  selector: 'demo-masonry',
  standalone: true,
  imports: [CeriousScrollDirective, DemoIconComponent, DemoDocsComponent],
  styleUrl: './masonry.css',
  template: `
    <div class="demo-page">
      <div class="demo-page__header"><h1><demo-icon name="masonry" />Masonry · canonical heights</h1><p>Angular templates flow into responsive columns from a pure height oracle, giving every card a reproducible position.</p></div>

      <demo-docs
        [feature]="DOCS_FEATURE"
        [docs]="DOCS_LINK"
        [introHtml]="DOCS_INTRO"
        [notesHtml]="DOCS_NOTES"
        [code]="DOCS_CODE"
      />
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
  /** 'How to build this' panel. Prose shared with the vanilla demos. */
  readonly DOCS_FEATURE = "layout: 'masonry': cards flowed into the shortest column";
  readonly DOCS_LINK = "https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/MASONRY.md";
  readonly DOCS_INTRO = "Masonry places each card into whichever column is currently shortest, which is a running decision rather than a layout the browser can be asked for. The engine keeps a frontier of column heights and extends it as you scroll, so the packing is computed once per card and never re-run. That is what stops the columns from re-ordering under you mid-scroll. Scrolling back up packs <em>upwards</em> from a saved snapshot, so the seam where the two directions meet has no gutter slack in it.";
  readonly DOCS_NOTES = [
    "Reserve space for media before it loads (an aspect-ratio box). A card that grows after measurement drags the column frontier with it.",
    "Column count is yours to drive: recreate or reconfigure on a breakpoint change.",
    "A <code>heightProvider</code> is an optimisation, not a requirement; it must be exact, because it replaces measurement rather than seeding it.",
    "Packing is deterministic: the same dataset and column count always produce the same layout, whichever direction you arrived from.",
  ];
  readonly DOCS_CODE = `<div
  ceriousScroll
  [ceriousScrollTotalElements]="200000"
  [ceriousScrollGetItem]="getItem"
  [ceriousScrollItemTemplate]="cardTpl"
  [ceriousScrollOptions]="{
    layout: 'masonry',
    masonry: {
      // Heights are computed, so the packer never has to measure.
      getItemHeight: heightOf,
      gap: 16,
      columnWidth: 240
    }
  }"
></div>`;

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
