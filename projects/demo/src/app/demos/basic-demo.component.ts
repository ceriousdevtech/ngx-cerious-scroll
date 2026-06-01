import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CeriousScrollDirective,
  type CeriousViewportChangeDetail,
} from 'ngx-cerious-scroll';

import { rand } from '../lib/random';

type Variation = 'uniform' | 'mixed' | 'variable';

@Component({
  selector: 'demo-basic',
  standalone: true,
  imports: [FormsModule, CeriousScrollDirective],
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1>🧱 Basic virtual scroll</h1>
        <p>Lazy <code>getItem</code> data source — no array is allocated, so a million rows costs nothing.</p>
      </div>

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
  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<number>;

  readonly SIZES = [100, 1_000, 10_000, 100_000, 1_000_000];
  private readonly PALETTE = ['#1f6feb', '#238636', '#a371f7', '#db6d28', '#cf222e', '#0969da'];

  total = 100_000;
  variation: Variation = 'mixed';
  jumpTo = '';
  viewport: CeriousViewportChangeDetail | null = null;

  /** Bound (stable identity) lazy getter — `item` is just the index. */
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
