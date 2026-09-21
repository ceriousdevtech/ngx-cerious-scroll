import { CommonModule } from '@angular/common';
import { Component, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import {
  emailRowHeight,
  lazyArray,
  makeRowDatasource,
  pickIndices,
  SCENARIOS,
  type CmpRow,
  type RowDatasource,
  type Scenario,
} from './comparison.data';

import { DemoIconComponent } from '../demo-icon.component';
import { DemoDocsComponent } from '../demo-docs.component';

const SIZE_BY_SCENARIO: Record<Scenario, number> = {
  'dynamic-height': 10_000,
  expanding: 10_000,
  'async-images': 5_000,
  millions: 5_000_000,
  'continuous-updates': 10_000,
  inbox: 250_000,
  spreadsheet: 50_000,
};

@Component({
  selector: 'demo-comparison',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollingModule, CeriousScrollDirective, DemoIconComponent, DemoDocsComponent],
  styleUrls: ['./comparison.css'],
  template: `
    <div class="cmp-page">
      <div class="cmp-header">
        <h1><demo-icon name="comparison" />Cerious Scroll vs Traditional Virtualization</h1>
        <p>Same dataset, same mutation, two engines. Watch which one stays stable.</p>
      </div>

      <demo-docs
        [feature]="DOCS_FEATURE"
        [docs]="DOCS_LINK"
        [introHtml]="DOCS_INTRO"
        [notesHtml]="DOCS_NOTES"
        [code]="DOCS_CODE"
      />

      <div class="cmp-toolbar">
        <label for="scn">Scenario</label>
        <select id="scn" [ngModel]="scenario" (ngModelChange)="setScenario($event)">
          @for (s of SCENARIOS; track s.id) {
            <option [ngValue]="s.id">{{ s.label }}</option>
          }
        </select>

        @if (scenario === 'dynamic-height') {
          <span style="font-size: 0.85rem; color: var(--muted)">
            Scroll to find rows up to 1800px tall (taller than the viewport).
          </span>
        } @else if (scenario === 'async-images') {
          <span style="font-size: 0.85rem; color: var(--muted)">
            Every row loads an image asynchronously, height grows on arrival.
          </span>
        } @else if (scenario === 'continuous-updates') {
          <span style="font-size: 0.85rem; color: var(--muted)">
            Streaming 50 mutations every 120ms…
          </span>
        } @else if (scenario === 'expanding') {
          <span style="font-size: 0.85rem; color: var(--muted)">
            Click any row to toggle expand.
          </span>
        } @else if (scenario === 'inbox') {
          <span style="font-size: 0.85rem; color: var(--muted)">
            Click "Mark all read" to expand every visible row's preview to 4 lines.
          </span>
          <button type="button" (click)="markAllRead()">Mark all read</button>
        } @else if (scenario === 'spreadsheet') {
          <span style="font-size: 0.85rem; color: var(--muted)">
            Scroll horizontally inside each row; click to expand a detail panel.
          </span>
        }

        <span class="spacer"></span>
        <span class="scenario-desc">{{ currentDesc() }}</span>
      </div>

      <div class="cmp-stage">
        <section class="cmp-side cmp-side--competitor">
          <header class="cmp-side__head">
            <span class="title">&#64;angular/cdk</span>
            <span class="badge">cdk-virtual-scroll-viewport</span>
            <span class="cmp-side__stats">
              <span>rows <span class="stat-num">{{ ds.total.toLocaleString() }}</span></span>
              @if (scenario === 'millions') {
                <span style="color: #cf222e; font-weight: 600">⚠ capped ≈ 411k by browser scrollHeight</span>
              }
            </span>
          </header>
          <div class="cmp-side__body">
            <cdk-virtual-scroll-viewport
              class="cdk-scroll"
              [itemSize]="cdkItemSize"
              minBufferPx="200"
              maxBufferPx="400"
            >
              <div
                *cdkVirtualFor="let row of cdkRows; let i = index; trackBy: trackById"
                [class]="'cmp-row' + (row.id % 2 ? ' alt' : '') + (row.hot > 0 ? ' hot' : '') + (row.isEmail && row.unread ? ' email-unread' : '') + (row.isSheet ? ' cmp-row--sheet' : '')"
                [style.height.px]="rowHeight(row)"
                (click)="toggleExpand(row.id)"
              >
                @if (row.isSheet) {
                  <div class="sheet-row">
                    <div class="sheet-scroll">
                      @for (cell of row.cells; track $index) {
                        <div [class]="'sheet-cell' + ($index === 0 ? ' sheet-cell--head' : '')">{{ cell }}</div>
                      }
                    </div>
                  </div>
                  @if (row.expanded) {
                    <div class="sheet-expand">
                      Detail panel for R{{ row.id }}, 240px tall. Cerious sees the new height the moment it appears.
                    </div>
                  }
                } @else if (row.isEmail) {
                  <div class="email-row">
                    <div class="email-head">
                      <span class="email-from">{{ row.from }}</span>
                      <span class="email-subject">{{ row.subject }}</span>
                    </div>
                    <div class="email-preview">
                      @for (n of previewLines(row.lineCount ?? 1); track n) {
                        <div class="email-preview-line">{{ row.preview }}</div>
                      }
                    </div>
                  </div>
                } @else {
                <div class="cmp-row__idx">#{{ row.id.toLocaleString() }}</div>
                <div class="cmp-row__body">
                  <div class="cmp-row__title">{{ row.title }}</div>
                  <div class="cmp-row__text">{{ row.text }}</div>
                  @if (row.hasImage) {
                    <div [class]="'cmp-row__media ' + (row.imageLoaded ? 'loaded' : 'pending')">
                      @if (row.imageLoaded) { 🖼  asset-{{ row.id % 1000 }}.jpg }
                      @else { ⏳ loading… }
                    </div>
                  }
                  @if (row.expanded) {
                    <div class="cmp-row__expand">
                      Expanded detail panel, adds 200px of content. Click row again to collapse.
                      <br />Generated lazily on demand.
                    </div>
                  }
                </div>
                }
              </div>
            </cdk-virtual-scroll-viewport>
            <div class="cmp-warn">
              @if (scenario === 'millions') {
                Browser caps element scrollHeight at ≈33.5M px. 5M × 80px = 400M px → list tops out near row 411,000 of 5,000,000.
              } @else if (scenario === 'spreadsheet') {
                Fixed itemSize=36, expanding a row to 276px desyncs the scrollbar.
              } @else {
                Fixed itemSize=80, variable heights mis-align the scrollbar.
              }
            </div>
          </div>
        </section>

        <section class="cmp-side cmp-side--cerious">
          <header class="cmp-side__head">
            <span class="title">Cerious Scroll</span>
            <span class="badge">Angular</span>
            <span class="cmp-side__stats">
              <span>rows <span class="stat-num">{{ ds.total.toLocaleString() }}</span></span>
            </span>
          </header>
          <div class="cmp-side__body">
            <div
              class="demo-scroll"
              [class.is-spreadsheet]="scenario === 'spreadsheet'"
              ceriousScroll
              [ceriousScrollTotalElements]="ds.total"
              [ceriousScrollGetItem]="getItem"
              [ceriousScrollItemTemplate]="rowTpl"
            ></div>
            <ng-template #rowTpl let-row>
              <div
                [class]="'cmp-row' + (row.id % 2 ? ' alt' : '') + (row.hot > 0 ? ' hot' : '') + (row.isEmail && row.unread ? ' email-unread' : '') + (row.isSheet ? ' cmp-row--sheet' : '')"
                [style.height.px]="rowHeight(row)"
                (click)="toggleExpand(row.id)"
              >
                @if (row.isSheet) {
                  <div class="sheet-row">
                    <div class="sheet-scroll">
                      @for (cell of row.cells; track $index) {
                        <div [class]="'sheet-cell' + ($index === 0 ? ' sheet-cell--head' : '')">{{ cell }}</div>
                      }
                    </div>
                  </div>
                  @if (row.expanded) {
                    <div class="sheet-expand">
                      Detail panel for R{{ row.id }}, 240px tall. Cerious sees the new height the moment it appears.
                    </div>
                  }
                } @else if (row.isEmail) {
                  <div class="email-row">
                    <div class="email-head">
                      <span class="email-from">{{ row.from }}</span>
                      <span class="email-subject">{{ row.subject }}</span>
                    </div>
                    <div class="email-preview">
                      @for (n of previewLines(row.lineCount ?? 1); track n) {
                        <div class="email-preview-line">{{ row.preview }}</div>
                      }
                    </div>
                  </div>
                } @else {
                <div class="cmp-row__idx">#{{ row.id.toLocaleString() }}</div>
                <div class="cmp-row__body">
                  <div class="cmp-row__title">{{ row.title }}</div>
                  <div class="cmp-row__text">{{ row.text }}</div>
                  @if (row.hasImage) {
                    <div [class]="'cmp-row__media ' + (row.imageLoaded ? 'loaded' : 'pending')">
                      @if (row.imageLoaded) { 🖼  asset-{{ row.id % 1000 }}.jpg }
                      @else { ⏳ loading… }
                    </div>
                  }
                  @if (row.expanded) {
                    <div class="cmp-row__expand">
                      Expanded detail panel, adds 200px of content. Click row again to collapse.
                      <br />Generated lazily on demand.
                    </div>
                  }
                </div>
                }
              </div>
            </ng-template>
            <div class="cmp-warn">
              @if (scenario === 'millions') {
                Sibling-driver scrollbar decouples virtual position from native scrollHeight, row 4,999,999 is reachable.
              } @else {
                No size cache, ResizeObserver tracks each row's real height live.
              }
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class ComparisonComponent implements OnDestroy {
  /** 'How to build this' panel. Prose shared with the vanilla demos. */
  readonly DOCS_FEATURE = "What the element-based camera changes, measured side by side";
  readonly DOCS_LINK = "https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md";
  readonly DOCS_INTRO = "This page runs cerious-scroll and a traditional pixel-offset virtualizer over the same five stress scenarios. The differences all come from one design choice: the camera is an <code>(element, offset)</code> pair rather than a scroll offset in pixels. There is no total pixel height to compute, so nothing has to be estimated, the scrollbar cannot drift as measurements arrive, jumping is O(1) at any dataset size, and there is no maximum-element-height ceiling to run into at a few million rows.";
  readonly DOCS_NOTES = [
    "A pixel model needs a total height before it can render, which means estimating heights it has not measured yet.",
    "Browsers cap element height (~16.7M px in Chrome), so a pixel spacer puts a hard ceiling on row count; an element camera has none.",
    "Because nothing is estimated, the scrollbar thumb does not resize as you scroll into unmeasured territory.",
    "Open the benchmark for the reproducible numbers behind this: mount time, per-frame cost, DOM footprint and heap.",
  ];
  readonly DOCS_CODE = `<!-- Same rows, same styling, two scrollers. The only difference is
     which one owns the camera. -->
<div
  ceriousScroll
  [ceriousScrollItems]="rows"
  [ceriousScrollItemTemplate]="rowTpl"
></div>`;

  @ViewChild(CeriousScrollDirective) cerious?: CeriousScrollDirective<CmpRow>;

  readonly SCENARIOS = SCENARIOS;
  scenario: Scenario = 'dynamic-height';

  get cdkItemSize(): number {
    return this.scenario === 'spreadsheet' ? 36 : 80;
  }

  ds: RowDatasource = makeRowDatasource(SIZE_BY_SCENARIO[this.scenario], this.scenario);
  cdkRows: readonly CmpRow[] = lazyArray(this.ds);

  readonly getItem = (i: number): CmpRow => this.ds.getRow(i);
  readonly trackById = (_: number, r: CmpRow) => r.id;

  private liveId: number | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly zone: NgZone) {
    this.wireDs();
  }

  setScenario(s: Scenario): void {
    this.scenario = s;
    this.ds = makeRowDatasource(SIZE_BY_SCENARIO[s], s);
    this.cdkRows = lazyArray(this.ds);
    this.wireDs();
    this.stopLive();
    if (s === 'continuous-updates') this.startLive();
  }

  private wireDs(): void {
    this.unsubscribe?.();
    // The datasource notifies via queueMicrotask, which escapes Angular's zone.
    // Re-enter the zone so change detection runs on the embedded row views.
    this.unsubscribe = this.ds.subscribe(() => this.zone.run(() => this.bumpCdk()));
  }

  currentDesc(): string {
    return SCENARIOS.find((x) => x.id === this.scenario)?.desc ?? '';
  }

  rowHeight(r: CmpRow): number {
    if (r.isSheet) return r.expanded ? 36 + 240 : 36;
    if (r.isEmail) return emailRowHeight(r);
    const base = Math.round(r.baseHeight * r.scale);
    if (r.expanded) return base + 200;
    return r.hasImage ? base + (r.imageLoaded ? 160 : 0) : base;
  }

  previewLines(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  markAllRead(): void {
    const cap = Math.min(this.ds.total, 1000);
    for (let i = 0; i < cap; i++) {
      this.ds.setOverride(i, { unread: false, lineCount: 8 });
    }
    this.bumpCdk();
  }

  toggleExpand(id: number): void {
    const r = this.ds.getRow(id);
    this.ds.setOverride(id, { expanded: !r.expanded });
    this.bumpCdk();
  }

  /** CDK's *cdkVirtualFor uses reference equality on the data source to decide
   *  whether to re-render, we swap the lazy proxy to force a re-read after a
   *  mutation. (Cerious picks the change up automatically via re-render.) */
  private bumpCdk(): void {
    this.cdkRows = lazyArray(this.ds);
    this.cerious?.recalculate?.();
  }

  private startLive(): void {
    this.liveId = window.setInterval(() => {
      const seed = (performance.now() | 0) & 0xffff;
      pickIndices(this.ds.total, 50, seed).forEach((i, k) => {
        const grow = (k & 1) === 0;
        this.ds.setOverride(i, {
          scale: grow ? 1.6 : 1,
          hot: (this.ds.getRow(i).hot + 1) & 7,
        });
      });
      this.bumpCdk();
    }, 120);
  }

  private stopLive(): void {
    if (this.liveId !== null) {
      window.clearInterval(this.liveId);
      this.liveId = null;
    }
  }

  ngOnDestroy(): void {
    this.stopLive();
    this.unsubscribe?.();
  }
}
