import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import { makeResult, SQL_COLUMNS, SQL_TOTAL, sqlStatusClass } from './sql.data';

@Component({
  selector: 'demo-sql-results',
  standalone: true,
  imports: [NgIf, CeriousScrollDirective],
  template: `
    <div class="demo-page sql-page">
      <div class="demo-page__header">
        <h1>🗄️ SQL Results</h1>
        <p>{{ total.toLocaleString() }} rows returned — click a row to select it.</p>
      </div>

      <pre class="sql-editor"><span class="kw">SELECT</span> id, customer, product, amount, status, created_at
<span class="kw">FROM</span>   orders
<span class="kw">WHERE</span>  amount &gt; 0
<span class="kw">ORDER BY</span> created_at <span class="kw">DESC</span>;</pre>

      <div class="demo-toolbar">
        <span class="stat">✓ <strong>{{ total.toLocaleString() }}</strong> rows · 0.024s</span>
        <span class="spacer"></span>
        <span class="stat">Selected row: <strong>{{ selected === null ? '—' : row(selected).id }}</strong></span>
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
