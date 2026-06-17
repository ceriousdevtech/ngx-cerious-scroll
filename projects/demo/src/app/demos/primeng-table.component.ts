import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FilterService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';
import type { CeriousScrollOptions } from 'ngx-cerious-scroll';

import {
  PtColumn,
  PtRow,
  PT_GLOBAL_FIELDS,
  PT_SELECT_COL_WIDTH,
  buildRows,
  defaultColumns,
  makeRow,
  statusLabel,
  statusSeverity,
} from './primeng-table.data';

/**
 * PrimeNG Table driven by Cerious-Scroll as the scroll engine.
 *
 * How the two cooperate (see the picker conversation in the PR):
 *
 *   • A REAL <p-table [value]="[]"> renders the authentic PrimeNG header — its
 *     sortable columns (pSortableColumn / p-sortIcon), per-column filter menus
 *     (p-columnFilter), column resize (pResizableColumn) and reorder
 *     (pReorderableColumn). Its `value` is intentionally empty so PrimeNG never
 *     tries to paint (or ngFor over) the full dataset.
 *
 *   • PrimeNG owns the WHOLE dataset's processing: column filters fire
 *     (onFilter) and we run PrimeNG's own `FilterService` over all rows; the
 *     header emits (onSort) and we sort all rows; the global box also uses
 *     `FilterService`. Selection state lives here and is reflected with PrimeNG
 *     checkboxes.
 *
 *   • Cerious-Scroll renders ONLY the visible window of the processed result
 *     (layout:'table'), in a second <table> whose columns are kept aligned with
 *     the PrimeNG header via a shared `columnWidths` array (the engine's
 *     recommended "external header" pattern).
 */
@Component({
  selector: 'demo-primeng-table',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    CheckboxModule,
    TagModule,
    InputTextModule,
    CeriousScrollDirective,
  ],
  template: `
    <div class="demo-page cs-pt-page">
      <div class="demo-page__header">
        <h1>🧩 PrimeNG Table · Cerious-Scroll engine</h1>
        <p>
          A real PrimeNG <code>&lt;p-table&gt;</code> header — sort, per-column
          filters, resize &amp; reorder — backed by PrimeNG's own
          <code>FilterService</code> over all
          {{ total.toLocaleString() }} rows, while <strong>Cerious-Scroll</strong>
          virtualizes the body (~25 rows in the DOM).
        </p>
      </div>

      <div class="demo-toolbar">
        <span class="p-input-icon-left" style="flex: 1; min-width: 220px">
          <input
            pInputText
            type="text"
            placeholder="Global search (name, email, department, status)…"
            [ngModel]="globalQuery"
            (ngModelChange)="onGlobalSearch($event)"
            style="width: 100%"
          />
        </span>
        <label>
          Rows:
          <select [value]="total" (change)="setTotal($any($event.target).value)">
            <option [value]="1000">1,000</option>
            <option [value]="10000">10,000</option>
            <option [value]="100000">100,000</option>
            <option [value]="1000000">1,000,000</option>
            <option [value]="5000000">5,000,000</option>
          </select>
        </label>
        <button type="button" (click)="clearAll()">Clear filters</button>
        <span class="stat"><strong>{{ shownCount.toLocaleString() }}</strong> shown</span>
      </div>

      <!-- PrimeNG header table. value is empty on purpose; we only want the
           interactive PrimeNG header chrome + feature events. -->
      <div class="cs-pt-headerwrap" #headerWrap>
        <p-table
          #dt
          [value]="emptyValue"
          [columns]="columns"
          dataKey="id"
          [resizableColumns]="true"
          columnResizeMode="fit"
          [reorderableColumns]="true"
          styleClass="cs-pt-header-table"
          (onSort)="onSort($event)"
          (onFilter)="onFilter()"
          (onColResize)="onColResize()"
          (onColReorder)="onColReorder()"
        >
          <ng-template pTemplate="header" let-cols>
            <tr>
              <th class="cs-pt-check-col" [style.width.px]="selectWidth">
                <p-checkbox
                  [binary]="true"
                  [ngModel]="headerChecked"
                  (onChange)="toggleAll($event.checked)"
                ></p-checkbox>
              </th>
              @for (col of cols; track col.field) {
                <th
                  class="cs-pt-col"
                  [pSortableColumn]="col.field"
                  pResizableColumn
                  pReorderableColumn
                  [style.width.px]="col.width"
                  [class.cs-num]="col.align === 'right'"
                  [class.cs-center]="col.align === 'center'"
                >
                  <div class="cs-pt-th">
                    <span class="cs-pt-th__label">{{ col.header }}</span>
                    <p-sortIcon [field]="col.field"></p-sortIcon>
                    <p-columnFilter
                      [field]="col.field"
                      [type]="filterType(col)"
                      display="menu"
                      [showClearButton]="true"
                    ></p-columnFilter>
                  </div>
                </th>
              }
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Cerious-Scroll body. Two feeding modes (see the class):
           · idle  → index-derived rows (getItem), so ANY size renders with ~zero
                     data memory — selecting 5,000,000 is instant.
           · sort/filter active → the materialized + processed PtRow[] window. -->
      <div
        class="demo-scroll cs-pt-scroll"
        ceriousScroll
        [ceriousScrollItems]="itemsInput"
        [ceriousScrollGetItem]="getItemInput"
        [ceriousScrollTotalElements]="totalInput"
        [ceriousScrollItemTemplate]="rowTpl"
        [ceriousScrollOptions]="bodyOptions"
      ></div>

      <div class="demo-footer">
        <span>Selected: <strong>{{ selectedCount.toLocaleString() }}</strong></span>
        <span>Sort: <strong>{{ sortField ? sortField + (sortOrder === 1 ? ' ▲' : ' ▼') : 'none' }}</strong></span>
        @if (featureActive) {
          <span>Mode: <strong>materialized</strong> ({{ shownCount.toLocaleString() }} processed)</span>
        } @else {
          <span>Mode: <strong>index-derived</strong> · ~25 rows in the DOM</span>
        }
        <span>Drag headers to reorder · drag edges to resize · click to sort · ⋮ to filter</span>
      </div>
    </div>

    <!-- Row template: roots are <td>s (engine appends them into its <tr>). Cells
         follow the live columns order so reorder stays consistent with the
         PrimeNG header. -->
    <ng-template #rowTpl let-item>
      <td class="cs-pt-check">
        <p-checkbox
          [binary]="true"
          [ngModel]="isSelected(item.id)"
          (onChange)="toggleRow(item)"
        ></p-checkbox>
      </td>
      @for (col of columns; track col.field) {
        <td [class.cs-num]="col.align === 'right'" [class.cs-center]="col.align === 'center'">
          @switch (col.type) {
            @case ('badge') {
              <p-tag [value]="statusLabel(item.status)" [severity]="statusSeverity(item.status)"></p-tag>
            }
            @default {
              {{ item[col.field] }}
            }
          }
        </td>
      }
    </ng-template>
  `,
})
export class PrimengTableComponent implements AfterViewInit {
  @ViewChild('dt') dt?: Table;
  @ViewChild('headerWrap') headerWrap?: ElementRef<HTMLElement>;
  @ViewChild(CeriousScrollDirective) body?: CeriousScrollDirective<PtRow>;

  readonly selectWidth = PT_SELECT_COL_WIDTH;
  readonly statusLabel = statusLabel;
  readonly statusSeverity = statusSeverity;

  /** Empty array fed to <p-table> so PrimeNG renders the header but no rows. */
  readonly emptyValue: PtRow[] = [];

  columns: PtColumn[] = defaultColumns();
  total = 100_000;

  /**
   * The full dataset, materialised LAZILY — only when a sort/filter actually
   * needs every row. Idle scrolling never builds it, so selecting 1,000,000 or
   * 5,000,000 rows is instant and costs ~no memory (rows are derived by index).
   */
  private materialized: PtRow[] | null = null;

  /** True while a sort / filter / global-search is active (materialised mode). */
  featureActive = false;
  /** Rows in the current view: `total` when idle, processed length otherwise. */
  shownCount = this.total;

  // Directive feeding inputs, swapped per mode in reprocess():
  //   idle    → getItem (index-derived rows), totalInput = total, items = null
  //   feature → items = processed window, getItem/total = null
  itemsInput: PtRow[] | null = null;
  getItemInput: ((index: number) => PtRow) | null = makeRow;
  totalInput: number | null = this.total;

  // Scalable selection: an "all" flag + an exception set, so select-all is O(1)
  // and never enumerates ids (works the same at 1k or 5,000,000 rows).
  private allSelected = false;
  private exceptions = new Set<number>();
  headerChecked = false;

  globalQuery = '';
  sortField: keyof PtRow | null = null;
  sortOrder: 1 | -1 = 1;

  /** Above this size, materialising for sort/filter is heavy enough to confirm. */
  private readonly MATERIALIZE_WARN = 1_000_000;
  private bigConfirmed = false;

  bodyOptions: CeriousScrollOptions = this.buildBodyOptions();

  private searchTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly filterService: FilterService) {}

  ngAfterViewInit(): void {
    // The PrimeNG header and the CS body live in separate tables; make their
    // widths exactly equal once the header has laid out.
    requestAnimationFrame(() => this.syncWidthsFromHeader());
  }

  filterType(col: PtColumn): string {
    return col.type === 'numeric' ? 'numeric' : 'text';
  }

  // ----- PrimeNG header events: PrimeNG owns the dataset, CS shows the window.

  onSort(e: { field?: string; order?: number }): void {
    this.sortField = (e.field as keyof PtRow) ?? null;
    this.sortOrder = e.order === -1 ? -1 : 1;
    this.reprocess();
  }

  onFilter(): void {
    // PrimeNG has updated `dt.filters`; re-derive the processed set from it.
    this.reprocess();
  }

  onGlobalSearch(value: string): void {
    this.globalQuery = value;
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.reprocess(), 250);
  }

  onColReorder(): void {
    // PrimeNG reordered `columns` in place; rebuild the body's colgroup/order.
    this.bodyOptions = this.buildBodyOptions();
    requestAnimationFrame(() => this.syncWidthsFromHeader());
  }

  onColResize(): void {
    requestAnimationFrame(() => this.syncWidthsFromHeader());
  }

  // ----- Selection. O(1) at any scale: an "all" flag + an exception set.

  isSelected(id: number): boolean {
    return this.allSelected ? !this.exceptions.has(id) : this.exceptions.has(id);
  }

  get selectedCount(): number {
    return this.allSelected
      ? Math.max(0, this.shownCount - this.exceptions.size)
      : this.exceptions.size;
  }

  toggleRow(item: PtRow): void {
    if (this.exceptions.has(item.id)) this.exceptions.delete(item.id);
    else this.exceptions.add(item.id);
    this.headerChecked = this.allSelected && this.exceptions.size === 0;
    this.body?.refreshRenderedContent();
  }

  toggleAll(checked: boolean): void {
    this.allSelected = checked;
    this.exceptions.clear();
    this.headerChecked = checked;
    this.body?.refreshRenderedContent();
  }

  private clearSelection(): void {
    this.allSelected = false;
    this.exceptions.clear();
    this.headerChecked = false;
  }

  // ----- Toolbar.

  setTotal(value: string): void {
    this.total = parseInt(value, 10);
    this.materialized = null; // free any prior dataset; rebuilt on demand
    this.bigConfirmed = false;
    this.clearSelection();
    // Reset PrimeNG's sort/filter UI and drop back to cheap index-derived mode.
    this.sortField = null;
    this.sortOrder = 1;
    this.globalQuery = '';
    this.dt?.clear();
    this.reprocess();
  }

  clearAll(): void {
    this.globalQuery = '';
    this.sortField = null;
    this.sortOrder = 1;
    this.dt?.clear(); // resets PrimeNG sort + filter UI state
    this.materialized = null; // release the big array when leaving feature mode
    this.reprocess();
  }

  // ----- Processing.
  //
  // Idle (no sort/filter): feed CS index-derived rows — no dataset in memory, so
  // any size scrolls instantly. When a feature is active, materialise the full
  // dataset (lazily, with a confirm past MATERIALIZE_WARN) and run PrimeNG's own
  // FilterService + the sort comparator over EVERY row, then hand CS the window.

  private reprocess(): void {
    const active = !!this.sortField || !!this.globalQuery.trim() || this.hasColumnFilter();

    if (!active) {
      this.featureActive = false;
      this.shownCount = this.total;
      this.itemsInput = null;
      this.getItemInput = makeRow;
      this.totalInput = this.total;
      if (this.total > this.MATERIALIZE_WARN) this.materialized = null;
      requestAnimationFrame(() => this.body?.jumpToElement(0));
      return;
    }

    if (!this.ensureMaterialized()) return; // user declined the big build

    let rows: PtRow[] = this.materialized!;

    const filters = (this.dt?.filters ?? {}) as Record<string, any>;
    for (const field of Object.keys(filters)) {
      if (field === 'global') continue;
      const raw = filters[field];
      const metas = Array.isArray(raw) ? raw : [raw];
      for (const meta of metas) {
        if (meta && meta.value !== null && meta.value !== undefined && meta.value !== '') {
          rows = this.filterService.filter(
            rows,
            [field],
            meta.value,
            meta.matchMode || 'contains',
            this.dt?.filterLocale
          );
        }
      }
    }

    const q = this.globalQuery.trim();
    if (q) {
      rows = this.filterService.filter(rows, PT_GLOBAL_FIELDS as string[], q, 'contains');
    }

    if (this.sortField) {
      const field = this.sortField;
      const dir = this.sortOrder;
      rows = rows.slice().sort((a, b) => this.compare(a[field], b[field]) * dir);
    }

    this.featureActive = true;
    this.shownCount = rows.length;
    this.itemsInput = rows;
    this.getItemInput = null;
    this.totalInput = null;
    if (this.allSelected) this.headerChecked = this.exceptions.size === 0;
    requestAnimationFrame(() => this.body?.jumpToElement(0));
  }

  private hasColumnFilter(): boolean {
    const filters = (this.dt?.filters ?? {}) as Record<string, any>;
    for (const field of Object.keys(filters)) {
      if (field === 'global') continue;
      const raw = filters[field];
      const metas = Array.isArray(raw) ? raw : [raw];
      for (const meta of metas) {
        if (meta && meta.value !== null && meta.value !== undefined && meta.value !== '') {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Build the full dataset on demand. Past MATERIALIZE_WARN this is a heavy
   * allocation (5,000,000 rows ≈ 1.3 GB / a couple seconds), so confirm once —
   * and make clear it's PrimeNG's data cost, not the scroll engine. Returns
   * false if the user declines (we then revert to index-derived mode).
   */
  private ensureMaterialized(): boolean {
    if (this.materialized && this.materialized.length === this.total) return true;

    if (this.total > this.MATERIALIZE_WARN && !this.bigConfirmed) {
      const mb = Math.round((this.total / 1_000_000) * 270);
      const size = mb >= 1000 ? (mb / 1000).toFixed(1) + ' GB' : mb + ' MB';
      const ok = window.confirm(
        `Sorting or filtering ${this.total.toLocaleString()} rows builds the full ` +
          `dataset in memory (~${size}, a brief pause).\n\n` +
          `Cerious-Scroll still renders only ~25 rows — this cost is PrimeNG's ` +
          `data processing, not the scroll engine.\n\nContinue?`
      );
      if (!ok) {
        // Revert PrimeNG's header state and stay in cheap index-derived mode.
        this.sortField = null;
        this.sortOrder = 1;
        this.globalQuery = '';
        this.dt?.clear();
        this.featureActive = false;
        this.shownCount = this.total;
        this.itemsInput = null;
        this.getItemInput = makeRow;
        this.totalInput = this.total;
        return false;
      }
      this.bigConfirmed = true;
    }

    this.materialized = buildRows(this.total);
    return true;
  }

  private compare(a: unknown, b: unknown): number {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b), undefined, { numeric: true });
  }

  // ----- Column-width sync between the PrimeNG header and the CS body.

  private buildBodyOptions(): CeriousScrollOptions {
    return {
      layout: 'table',
      table: {
        tableClassName: 'cs-pt-body-table',
        theadClassName: 'cs-pt-body-thead',
        tbodyClassName: 'cs-pt-body-tbody',
        columnWidths: [
          this.selectWidth + 'px',
          ...this.columns.map((c) => c.width + 'px'),
        ],
      },
    };
  }

  /**
   * Read the actual rendered <th> widths from the PrimeNG header (after a resize
   * or reorder) and push them into the body's colgroup so the two tables stay
   * pixel-aligned. Recreating `bodyOptions` swaps the engine's colgroup.
   */
  private syncWidthsFromHeader(): void {
    const host = this.headerWrap?.nativeElement;
    if (!host) return;
    const ths = host.querySelectorAll<HTMLElement>('thead .cs-pt-col');
    if (ths.length !== this.columns.length) return;
    let changed = false;
    ths.forEach((th, i) => {
      const w = Math.round(th.getBoundingClientRect().width);
      if (w > 0 && w !== this.columns[i].width) {
        this.columns[i].width = w;
        changed = true;
      }
    });
    if (changed) this.bodyOptions = this.buildBodyOptions();
  }
}
