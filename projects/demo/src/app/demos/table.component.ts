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

import { DemoIconComponent } from '../demo-icon.component';
import { DemoDocsComponent } from '../demo-docs.component';

@Component({
  selector: 'demo-table',
  standalone: true,
  imports: [CeriousScrollDirective, DemoIconComponent, DemoDocsComponent],
  template: `
    <div class="demo-page cs-table-page">
      <div class="demo-page__header">
        <h1><demo-icon name="table" />Native &lt;table&gt; mode</h1>
        <p>
          Real <code>&lt;tr&gt;</code>/<code>&lt;td&gt;</code> rows via
          <code>layout: 'table'</code>, frozen header, aligned columns, single
          tbody transform. Virtualizes {{ total.toLocaleString() }} rows with ~25 in the DOM.
        </p>
      </div>

      <demo-docs
        [feature]="DOCS_FEATURE"
        [docs]="DOCS_LINK"
        [introHtml]="DOCS_INTRO"
        [notesHtml]="DOCS_NOTES"
        [code]="DOCS_CODE"
      />

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
  /** 'How to build this' panel. Prose shared with the vanilla demos. */
  readonly DOCS_FEATURE = "layout: 'table', real <table> semantics, virtualized";
  readonly DOCS_LINK = "https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md";
  readonly DOCS_INTRO = "A virtualized table usually means divs pretending to be a table, which costs you column auto-sizing, real table semantics and anything a screen reader knows about <code>&lt;tr&gt;</code> and <code>&lt;td&gt;</code>. <code>layout: 'table'</code> renders actual table elements instead: your rows are <code>&lt;tr&gt;</code>, they live in a single <code>&lt;tbody&gt;</code>, and the engine moves that one element rather than positioning every row. The header is a real <code>&lt;thead&gt;</code> occupying real space, so the rows simply begin beneath it.";
  readonly DOCS_NOTES = [
    "Give columns explicit widths (or <code>table-layout: fixed</code>). Auto layout measures only the mounted rows, so column widths would shift as you scroll.",
    "Do not set ARIA roles here: real table elements already announce correctly, and a role overrides rather than augments them.",
    "Row heights are still measured per row, so variable-height <code>&lt;tr&gt;</code>s are fine.",
    "The whole <code>&lt;tbody&gt;</code> moves as one transform, which is why this stays cheap at a million rows.",
  ];
  readonly DOCS_CODE = `<div
  ceriousScroll
  [ceriousScrollTotalElements]="1000000"
  [ceriousScrollGetItem]="getItem"
  [ceriousScrollItemTemplate]="rowTpl"
  [ceriousScrollHeaderTemplate]="headTpl"
  [ceriousScrollOptions]="{ layout: 'table', table: { autoSizeColumns: true } }"
></div>

<!-- Declarative thead, in the SAME table as the rows. -->
<ng-template #headTpl><tr><th>Id</th><th>Name</th><th>Status</th></tr></ng-template>

<!-- The item template fills a real tr, so emit td cells. -->
<ng-template #rowTpl let-index="index">
  <td>{{ index }}</td>
  <td>{{ data[index].name }}</td>
</ng-template>`;

  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<number>;

  readonly columns = TABLE_COLUMNS;
  total = TABLE_TOTAL;

  // Header in the engine's <thead> (declarative template). autoSizeColumns
  // measures widths once then pins them, auto-sized but stable, no manual widths.
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
