import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import { makeResult, SQL_COLUMNS, SQL_TOTAL, sqlStatusClass } from './sql.data';

import { DemoIconComponent } from '../demo-icon.component';
import { DemoDocsComponent } from '../demo-docs.component';

@Component({
  selector: 'demo-sql-results',
  standalone: true,
  imports: [NgIf, CeriousScrollDirective, DemoIconComponent, DemoDocsComponent],
  template: `
    <div class="demo-page sql-page">
      <div class="demo-page__header">
        <h1><demo-icon name="sql" />SQL Results</h1>
        <p>{{ total.toLocaleString() }} rows returned, click a row to select it.</p>
      </div>

      <demo-docs
        [feature]="DOCS_FEATURE"
        [docs]="DOCS_LINK"
        [introHtml]="DOCS_INTRO"
        [notesHtml]="DOCS_NOTES"
        [code]="DOCS_CODE"
      />

      <pre class="sql-editor"><span class="kw">SELECT</span> id, customer, product, amount, status, created_at
<span class="kw">FROM</span>   orders
<span class="kw">WHERE</span>  amount &gt; 0
<span class="kw">ORDER BY</span> created_at <span class="kw">DESC</span>;</pre>

      <div class="demo-toolbar">
        <span class="stat">✓ <strong>{{ total.toLocaleString() }}</strong> rows · 0.024s</span>
        <span class="spacer"></span>
        <span class="stat">Selected row: <strong>{{ selected === null ? ', ' : row(selected).id }}</strong></span>
      </div>

      <div
        class="demo-scroll sql-scroll"
        ceriousScroll
        [ceriousScrollTotalElements]="total"
        [ceriousScrollGetItem]="getItem"
        [ceriousScrollItemTemplate]="rowTpl"
        [ceriousScrollOptions]="sqlOptions"
      >
        <div class="sql-h-scroll" #hScroll>
          <div class="sql-head">
            @for (c of columns; track c) {
              <div class="sql-head__cell">{{ c }}</div>
            }
          </div>
          <div data-cerious-scroll-content class="sql-scroll-content"></div>
        </div>
      </div>

      <ng-template #rowTpl let-i="index">
        <div class="sql-row" [class.selected]="selected === i" (click)="selected = i" *ngIf="row(i) as r">
          <div class="sql-cell id">{{ r.id }}</div>
          <div class="sql-cell">{{ r.customer }}</div>
          <div class="sql-cell">{{ r.product }}</div>
          <div class="sql-cell num">{{ '$' + r.amount.toLocaleString() }}</div>
          <div class="sql-cell"><span class="sql-badge" [class]="badge(r.status)">{{ r.status }}</span></div>
          <div class="sql-cell">{{ r.date }}</div>
        </div>
      </ng-template>
    </div>
  `,
})
export class SqlResultsComponent {
  /** 'How to build this' panel. Prose shared with the vanilla demos. */
  readonly DOCS_FEATURE = "Result sets with selection and stable identity";
  readonly DOCS_LINK = "https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md";
  readonly DOCS_INTRO = "A result grid is a plain vertical scroller over an array of rows, with one subtlety worth stating: selection must be keyed on something stable. Re-run the query, sort a column, or filter, and index 40 is a different row than it was, so a selection stored as a set of indices silently selects the wrong things. Store row identity instead and the selection survives anything you do to the view.";
  readonly DOCS_NOTES = [
    "Key selection on row identity. Indices are a property of the current view, not of the data.",
    "A new result set means a new length and a full repaint: <code>updateTotalElements()</code> then <code>refresh()</code>.",
    "Column widths should be fixed once per result set, not measured from the mounted rows.",
    "For very wide result sets, render only the columns you want visible and let the user choose the rest; the engine virtualizes rows, not columns.",
  ];
  readonly DOCS_CODE = `// Selection keyed by a stable id, never by row index: the index belongs
// to the window, the id belongs to the datum.
selected = new Set<number>();

<ng-template #rowTpl let-row>
  <app-row [row]="row" [selected]="selected.has(row.id)" (pick)="pick(row.id)" />
</ng-template>`;

  @ViewChild('hScroll', { static: false }) hScroll?: ElementRef<HTMLDivElement>;

  readonly total = SQL_TOTAL;
  readonly columns = SQL_COLUMNS;
  protected readonly row = makeResult;
  protected readonly badge = sqlStatusClass;

  readonly sqlOptions = {
    touch: { enabled: true, getHorizontalScrollTarget: () => this.hScroll?.nativeElement ?? null },
  };

  selected: number | null = null;
  readonly getItem = (i: number): number => i;
}
