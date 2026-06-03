import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import {
  buildOrder,
  GRID_COLUMNS,
  makeRow,
  statusClass,
  type GridColumn,
  type SortDir,
} from './data-grid.data';

@Component({
  selector: 'demo-data-grid',
  standalone: true,
  imports: [NgIf, CeriousScrollDirective],
  template: `
    <div class="demo-page grid-page">
      <div class="demo-page__header">
        <h1>📊 Enterprise Data Grid</h1>
        <p>Sort, search, and multi-select across {{ order.length.toLocaleString() }} of 100,000 records.</p>
      </div>

      <div class="demo-toolbar">
        <input
          type="search"
          placeholder="Search id, name, email, department…"
          [value]="query"
          (input)="onSearch($any($event.target).value)"
          style="flex: 1; min-width: 220px"
        />
        <button type="button" (click)="exportRows()">📥 Export</button>
        <button type="button" (click)="reset()">🔄 Reset</button>
        <span class="stat"><strong>{{ order.length.toLocaleString() }}</strong> rows</span>
      </div>

      <div
        class="demo-scroll grid-scroll"
        ceriousScroll
        [ceriousScrollItems]="order"
        [ceriousScrollItemTemplate]="rowTpl"
        [ceriousScrollOptions]="gridOptions"
        (ceriousScrollViewportChange)="onViewport()"
      >
        <div class="grid-h-scroll" #hScroll>
          <div class="grid-head">
            @for (c of columns; track c.key) {
              <div class="grid-head__cell" [class.sortable]="c.sortable" (click)="c.sortable && toggleSort(c.key)">
                {{ c.label }}
                @if (c.sortable) {
                  <span class="grid-head__sort" [class.active]="sortCol === c.key">
                    {{ sortCol === c.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅' }}
                  </span>
                }
              </div>
            }
          </div>
          <div data-cerious-scroll-content class="grid-scroll-content"></div>
        </div>
      </div>

      <ng-template #rowTpl let-item>
        <div class="grid-row" [class.selected]="selected.has(item)" (click)="clickRow(item, $event)">
          <ng-container *ngIf="row(item) as r">
            <div class="grid-cell rownum">{{ r.index + 1 }}</div>
            <div class="grid-cell id">{{ r.id }}</div>
            <div class="grid-cell">{{ r.name }}</div>
            <div class="grid-cell email">{{ r.email }}</div>
            <div class="grid-cell">{{ r.department }}</div>
            <div class="grid-cell">
              <span class="badge" [class]="badgeClass(r.status)">{{ r.status }}</span>
            </div>
            <div class="grid-cell">{{ r.region }}</div>
            <div class="grid-cell num" [class]="r.revenue >= 0 ? 'cell-positive' : 'cell-negative'">
              {{ r.revenue >= 0 ? '+' : '−' }}{{ '$' + abs(r.revenue).toLocaleString() }}
            </div>
            <div class="grid-cell num">{{ r.score.toFixed(1) }}</div>
            <div class="grid-cell">{{ r.date }}</div>
          </ng-container>
        </div>
      </ng-template>

      <div class="demo-footer">
        <span>Selected: <strong>{{ selected.size }}</strong></span>
        <span>Ctrl/Cmd-click to multi-select · click a header to sort</span>
      </div>
    </div>
  `,
})
export class DataGridComponent {
  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<number>;
  @ViewChild('hScroll', { static: false }) hScroll?: ElementRef<HTMLDivElement>;

  readonly gridOptions = {
    touch: { enabled: true, getHorizontalScrollTarget: () => this.hScroll?.nativeElement ?? null },
  };

  readonly columns = GRID_COLUMNS;
  protected readonly row = makeRow;
  protected readonly badgeClass = statusClass;

  query = '';
  sortCol: GridColumn | null = null;
  sortDir: SortDir = 'asc';
  selected = new Set<number>();
  order: number[] = buildOrder('', null, 'asc');

  private searchTimer?: ReturnType<typeof setTimeout>;

  abs(n: number): number {
    return Math.abs(n);
  }

  onSearch(value: string): void {
    this.query = value;
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.rebuild(), 250);
  }

  toggleSort(col: GridColumn): void {
    if (this.sortCol === col) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else {
      this.sortCol = col;
      this.sortDir = 'asc';
    }
    this.rebuild();
  }

  clickRow(src: number, e: MouseEvent): void {
    const additive = e.ctrlKey || e.metaKey;
    const next = new Set(additive ? this.selected : []);
    if (this.selected.has(src) && (additive || this.selected.size === 1)) next.delete(src);
    else next.add(src);
    this.selected = next;
  }

  exportRows(): void {
    alert(`Exporting ${this.selected.size || this.order.length} rows…`);
  }

  reset(): void {
    this.query = '';
    this.sortCol = null;
    this.selected = new Set();
    this.rebuild();
  }

  /** Re-derived viewport callback hook (kept for parity; stats read live). */
  onViewport(): void {}

  private rebuild(): void {
    this.order = buildOrder(this.query, this.sortCol, this.sortDir);
    requestAnimationFrame(() => this.scroller?.jumpToElement(0));
  }
}
