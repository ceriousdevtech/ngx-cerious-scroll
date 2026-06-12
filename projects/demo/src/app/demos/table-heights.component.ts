import { Component, ViewChild } from '@angular/core';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';
import type { CeriousScrollOptions } from 'ngx-cerious-scroll';

import {
  HEIGHTS_COLUMNS,
  HEIGHTS_COLUMN_WIDTHS,
  HEIGHTS_TOTAL,
  makeHeightsRow,
  type HeightsRow,
} from './table-heights.data';

@Component({
  selector: 'demo-table-heights',
  standalone: true,
  imports: [CeriousScrollDirective],
  template: `
    <div class="demo-page cs-heights-page">
      <div class="demo-page__header">
        <h1>🪜 Native &lt;table&gt; · wild dynamic heights</h1>
        <p>
          Real <code>&lt;tr&gt;</code>/<code>&lt;td&gt;</code> rows via <code>layout: 'table'</code>, but every
          row has a <strong>different, unpredictable height</strong> — one-liners next to walls of text, long
          lists, code blocks, tall banners and wrapping tag clouds. Each row is <em>measured</em>, so the
          single &lt;tbody&gt; transform stays pixel-correct.
        </p>
      </div>

      <div class="demo-toolbar">
        <label>
          Rows:
          <select [value]="total" (change)="setTotal($any($event.target).value)">
            <option [value]="1000">1,000</option>
            <option [value]="100000">100,000</option>
            <option [value]="1000000">1,000,000</option>
          </select>
        </label>
        <span>
          Jump to
          <input type="number" min="0" [value]="jump" (change)="jump = +$any($event.target).value" style="width: 90px" />
          <button type="button" (click)="scroller?.jumpToElement(jump)">Go</button>
        </span>
        <button type="button" (click)="scroller?.scrollToPercentage(0)">Top</button>
        <button type="button" (click)="scroller?.scrollToPercentage(100)">End</button>
        <span class="stat"><strong>{{ total.toLocaleString() }}</strong> rows</span>
      </div>

      <div
        class="demo-scroll cs-table-scroll"
        ceriousScroll
        [ceriousScrollTotalElements]="total"
        [ceriousScrollGetItem]="getItem"
        [ceriousScrollItemTemplate]="rowTpl"
        [ceriousScrollHeaderTemplate]="headerTpl"
        [ceriousScrollOptions]="tableOptions"
      ></div>

      <div class="demo-footer">
        <span>Total: <strong>{{ total.toLocaleString() }}</strong></span>
        <span>Mode: <strong>layout: 'table'</strong></span>
        <span>Heights: <strong>measured per row</strong></span>
      </div>
    </div>

    <ng-template #headerTpl>
      <tr>
        @for (c of columns; track c.key) {
          <th [class]="c.cls">{{ c.label }}</th>
        }
      </tr>
    </ng-template>

    <ng-template #rowTpl let-index>
      <td class="col-id"><span class="cell-id">{{ row(index).id }}</span></td>
      <td class="col-kind"><span class="kind-badge {{ row(index).kindCls }}">{{ row(index).kindLabel }}</span></td>
      <td class="col-body">
        @switch (row(index).kind) {
          @case ('line') {
            <p class="body-text">{{ row(index).paragraphs[0] }}</p>
          }
          @case ('list') {
            <p class="body-title">{{ row(index).title }}</p>
            <ul class="body-list">@for (it of row(index).listItems; track $index) { <li>{{ it }}</li> }</ul>
          }
          @case ('code') {
            <p class="body-title">{{ row(index).title }}</p>
            <pre class="body-code">{{ row(index).codeLines.join('\n') }}</pre>
          }
          @case ('banner') {
            <div
              class="body-banner"
              [style.height.px]="row(index).bannerPx"
              [style.background]="row(index).bannerColor.bg"
              [style.borderColor]="row(index).bannerColor.bd"
              [style.color]="row(index).bannerColor.fg"
            >{{ row(index).bannerText }}</div>
          }
          @case ('tags') {
            <p class="body-title">{{ row(index).title }}</p>
            <div class="body-tags">@for (t of row(index).tags; track $index) { <span class="body-tag">#{{ t }}</span> }</div>
          }
          @default {
            <!-- para / wall -->
            <p class="body-title">{{ row(index).title }}</p>
            @for (p of row(index).paragraphs; track $index) { <p class="body-text">{{ p }}</p> }
          }
        }
      </td>
      <td class="col-meta">
        <span class="meta-row"><span class="meta-k">{{ '@' }}</span><span class="meta-v">{{ row(index).owner }}</span></span>
        <span class="meta-row"><span class="meta-k">v</span><span class="meta-v">{{ row(index).version }}</span></span>
      </td>
    </ng-template>
  `,
})
export class TableHeightsComponent {
  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<number>;

  readonly columns = HEIGHTS_COLUMNS;
  total = HEIGHTS_TOTAL;
  jump = 5000;

  readonly tableOptions: CeriousScrollOptions = {
    layout: 'table',
    table: { tableClassName: 'cs-table', columnWidths: [...HEIGHTS_COLUMN_WIDTHS] },
  };

  readonly getItem = (i: number): number => i;

  // Memoize the row for the current index so the many cell bindings below don't
  // each re-run makeHeightsRow (Angular evaluates a view's bindings together).
  private _index = -1;
  private _row: HeightsRow | null = null;
  row(index: number): HeightsRow {
    if (this._index !== index || this._row === null) {
      this._index = index;
      this._row = makeHeightsRow(index);
    }
    return this._row;
  }

  setTotal(value: string): void {
    this.total = parseInt(value, 10);
  }
}
