import { Component, ViewChild } from '@angular/core';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';
import type { CeriousScrollOptions } from 'ngx-cerious-scroll';

import {
  TABLE_COLUMNS,
  TABLE_TOTAL,
  makeRow,
  statusLabel,
  type TableRow,
} from './table.data';

@Component({
  selector: 'demo-table',
  standalone: true,
  imports: [CeriousScrollDirective],
  template: `
    <div class="demo-page cs-table-page">
      <div class="demo-page__header">
        <h1>🧮 Native &lt;table&gt; mode</h1>
        <p>
          Real <code>&lt;tr&gt;</code>/<code>&lt;td&gt;</code> rows via
          <code>layout: 'table'</code> — frozen header, aligned columns, single
          tbody transform. Virtualizes {{ total.toLocaleString() }} rows with ~25 in the DOM.
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
      </div>
    </div>

    <!-- Declarative header rendered into the engine's <thead> (same table as the
         rows → native column alignment, frozen via tbody-only transform). -->
    <ng-template #headerTpl>
      <tr>
        @for (c of columns; track c.key) {
          <th [class]="c.cls">{{ c.label }}</th>
        }
      </tr>
    </ng-template>

    <!-- Row template: roots are <td>s so the engine appends them straight into
         its <tr> (no structural directive at the root, which would hide the cells
         from the directive's recycle re-append). -->
    <ng-template #rowTpl let-index>
      <td class="cell-id">{{ row(index).id }}</td>
      <td class="cell-name">{{ row(index).name }}</td>
      <td>
        <span class="badge badge--{{ row(index).status }}">{{ statusLabel(row(index).status) }}</span>
      </td>
      <td>{{ row(index).email }}</td>
      <td class="num">{{ row(index).score.toLocaleString() }}</td>
    </ng-template>
  `,
})
export class TableComponent {
  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<number>;

  readonly columns = TABLE_COLUMNS;
  total = TABLE_TOTAL;

  // Header in the engine's <thead> (declarative template). autoSizeColumns
  // measures widths once then pins them — auto-sized but stable, no manual widths.
  readonly tableOptions: CeriousScrollOptions = {
    layout: 'table',
    table: { tableClassName: 'cs-table', autoSizeColumns: true },
  };

  readonly getItem = (i: number): number => i;

  // Memoize the row for the current index so the five cell bindings below don't
  // each re-run makeRow (Angular evaluates a view's bindings together, per row).
  private _index = -1;
  private _row: TableRow | null = null;
  row(index: number): TableRow {
    if (this._index !== index || this._row === null) {
      this._index = index;
      this._row = makeRow(index);
    }
    return this._row;
  }

  statusLabel = statusLabel;

  setTotal(value: string): void {
    this.total = parseInt(value, 10);
  }
}
