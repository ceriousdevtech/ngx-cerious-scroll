import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CeriousScrollDirective,
  type CeriousViewportChangeDetail,
} from 'ngx-cerious-scroll';

import { rand } from '../lib/random';

import { DemoIconComponent } from '../demo-icon.component';
import { DemoDocsComponent } from '../demo-docs.component';

type Variation = 'uniform' | 'mixed' | 'variable';

@Component({
  selector: 'demo-basic',
  standalone: true,
  imports: [FormsModule, CeriousScrollDirective, DemoIconComponent, DemoDocsComponent],
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1><demo-icon name="basic" />Basic virtual scroll</h1>
        <p>Lazy <code>getItem</code> data source, no array is allocated, so a million rows costs nothing.</p>
      </div>

      <demo-docs
        [feature]="DOCS_FEATURE"
        [docs]="DOCS_LINK"
        [introHtml]="DOCS_INTRO"
        [notesHtml]="DOCS_NOTES"
        [code]="DOCS_CODE"
      />

      <div class="demo-toolbar">
        <label for="size">Rows</label>
        <select id="size" [(ngModel)]="total">
          @for (s of SIZES; track s) {
            <option [ngValue]="s">{{ s.toLocaleString() }}</option>
          }
        </select>

        <label for="var">Heights</label>
        <select id="var" [(ngModel)]="variation">
          <option value="uniform">Uniform (44px)</option>
          <option value="mixed">Mixed (44/64/104px)</option>
          <option value="variable">Variable (32–152px)</option>
        </select>

        <span style="display: inline-flex; gap: 6px">
          <input
            type="number"
            [min]="0"
            [max]="total - 1"
            placeholder="row #"
            [(ngModel)]="jumpTo"
            style="width: 110px"
            (keydown.enter)="handleJump()"
          />
          <button type="button" (click)="handleJump()">Go</button>
          <button type="button" (click)="scroller?.reset()">Top</button>
          <button type="button" (click)="scroller?.scrollToPercentage(100)">End</button>
        </span>

        <span class="spacer"></span>
        <span class="stat">
          {{
            viewport
              ? 'top row ' + viewport.currentElement.toLocaleString() + ' · ' + viewport.percentage.toFixed(1) + '%'
              : 'scroll to see live stats'
          }}
        </span>
      </div>

      <div
        class="demo-scroll"
        ceriousScroll
        [ceriousScrollTotalElements]="total"
        [ceriousScrollGetItem]="getItem"
        [ceriousScrollItemTemplate]="rowTpl"
        (ceriousScrollViewportChange)="viewport = $event"
      ></div>

      <ng-template #rowTpl let-index="index">
        <div
          class="basic-row"
          [style.height.px]="heightFor(index, variation)"
          [style.borderLeftColor]="color(index)"
        >
          <span class="basic-row__index">#{{ index.toLocaleString() }}</span>
          <span
            class="basic-row__bar"
            [style.background]="color(index)"
            [style.width.%]="30 + (index % 60)"
          ></span>
          <span class="basic-row__meta">{{ heightFor(index, variation) }}px</span>
        </div>
      </ng-template>

      <div class="demo-footer">
        <span>Total: <strong>{{ total.toLocaleString() }}</strong></span>
        <span>Mode: <strong>{{ variation }}</strong></span>
      </div>
    </div>
  `,
})
export class BasicDemoComponent {
  /** 'How to build this' panel. Prose shared with the vanilla demos. */
  readonly DOCS_FEATURE = "The base case: host, total, render";
  readonly DOCS_LINK = "https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md";
  readonly DOCS_INTRO = "Everything else on this site is a variation on these three arguments. You give the engine a host element, how many items exist, and a function that fills one element for a given index. It mounts only what is visible and recycles elements as the window moves, so the DOM node count is a function of your viewport, never of your dataset. Heights are <em>measured</em>, never estimated, which is why a million rows of unpredictable height behaves the same as a million uniform ones.";
  readonly DOCS_NOTES = [
    "The renderer is called for a recycled element. Clearing it first is the simplest correct thing; reusing child nodes is the fastest.",
    "Row heights are measured from the DOM. You do not need to declare them, and they may differ per row.",
    "<code>jumpToElement</code> is constant-time. The camera is an <code>(element, offset)</code> pair, so there is no pixel total to compute.",
    "<code>updateTotalElements</code> grows or shrinks the dataset in place without moving the camera.",
  ];
  readonly DOCS_CODE = `<div
  class="feed"
  ceriousScroll
  [ceriousScrollTotalElements]="total"
  [ceriousScrollGetItem]="getItem"
  [ceriousScrollItemTemplate]="rowTpl"
></div>

<ng-template #rowTpl let-index="index">
  <app-row [index]="index" />
</ng-template>`;

  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<number>;

  readonly SIZES = [100, 1_000, 10_000, 100_000, 1_000_000];
  private readonly PALETTE = ['#1f6feb', '#238636', '#a371f7', '#db6d28', '#cf222e', '#0969da'];

  total = 100_000;
  variation: Variation = 'mixed';
  jumpTo = '';
  viewport: CeriousViewportChangeDetail | null = null;

  /** Bound (stable identity) lazy getter, `item` is just the index. */
  readonly getItem = (index: number): number => index;

  heightFor(index: number, variation: Variation): number {
    if (variation === 'uniform') return 44;
    if (variation === 'mixed') return [44, 64, 104][index % 3];
    return 32 + Math.floor(rand(index, 7) * 120); // variable: 32–152px
  }

  color(index: number): string {
    return this.PALETTE[index % this.PALETTE.length];
  }

  // Changing the height variation updates each row's template height via change
  // detection; the engine's content observer detects it and reflows. No
  // recalculate needed.

  handleJump(): void {
    const i = Number.parseInt(this.jumpTo, 10);
    if (Number.isFinite(i)) this.scroller?.jumpToElement(Math.max(0, Math.min(this.total - 1, i)));
  }
}
