import { Component, OnDestroy, ViewChild } from '@angular/core';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';
import type { CeriousScrollOptions, CeriousViewportChangeDetail } from 'ngx-cerious-scroll';

import {
  STREAM_COLUMNS,
  STREAM_COLUMN_WIDTHS,
  makeEvent,
  type StreamEvent,
} from './table-stream.data';

// FIXED element count so the engine is never recreated on a prepend (growing
// totalElements would tear down + rebuild the whole scroller every inject — that
// read as scrollbar thrash). Content slides under a fixed window instead:
// index i shows seq = baseSeq - i; "prepending k" grows baseSeq by k while we
// shift the scroll position by k to hold the anchor.
const TOTAL = 2000;

@Component({
  selector: 'demo-table-stream',
  standalone: true,
  imports: [CeriousScrollDirective],
  template: `
    <div class="demo-page cs-stream-page">
      <div class="demo-page__header">
        <h1>📡 Native &lt;table&gt; · prepend &amp; scroll anchoring</h1>
        <p>
          New, <strong>variable-height</strong> rows are injected at the <strong>top</strong> of the stream —
          like a live telemetry feed or a chat-history backfill. Scroll down a bit, then inject: with anchoring
          on, the row you're reading stays put while new rows pile up above; with <em>Follow newest</em> on,
          the view rides the top instead.
        </p>
      </div>

      <div class="demo-toolbar">
        <button type="button" (click)="prepend(1)">Inject 1 ↑</button>
        <button type="button" (click)="prepend(25)">Backfill 25 ↑</button>
        <button type="button" (click)="toggleLive()">
          <span class="live-dot" [class.on]="live"></span>Live feed
        </button>
        <label title="Jump to newest on every inject instead of holding position">
          <input type="checkbox" [checked]="follow" (change)="setFollow($any($event.target).checked)" /> Follow newest
        </label>
        <button type="button" (click)="goTop()">Top</button>
        <span class="stat">{{ stat }}</span>
      </div>

      <div class="scroll-wrap">
        @if (newAbove > 0) {
          <button type="button" class="new-above" (click)="goTop()">▲ {{ newAbove }} new above</button>
        }
        <div
          class="demo-scroll cs-table-scroll"
          ceriousScroll
          [ceriousScrollTotalElements]="total"
          [ceriousScrollGetItem]="getItem"
          [ceriousScrollItemTemplate]="rowTpl"
          [ceriousScrollHeaderTemplate]="headerTpl"
          [ceriousScrollOptions]="tableOptions"
          (ceriousScrollReady)="onReady($event)"
          (ceriousScrollViewportChange)="onViewport($event)"
        ></div>
      </div>

      <div class="demo-footer">
        <span>Stream length: <strong>{{ seen.toLocaleString() }}</strong></span>
        <span>Mode: <strong>layout: 'table'</strong></span>
        <span>Anchoring: <strong>{{ follow ? 'follow newest' : 'hold position' }}</strong></span>
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
      <td class="col-time" [class.is-new]="isNew(ev(index))">
        <span class="cell-time">{{ ev(index).clock }}</span>
        <span class="cell-ago">{{ ago(ev(index)) === 0 ? 'now' : ago(ev(index)) + 's ago' }}</span>
      </td>
      <td class="col-level"><span class="lvl lvl-{{ ev(index).level }}">{{ ev(index).level }}</span></td>
      <td class="col-event">
        @switch (ev(index).kind) {
          @case ('metric') {
            <p class="ev-text"><strong>{{ ev(index).service }}</strong> · {{ ev(index).metricLine }}</p>
          }
          @case ('event') {
            <p class="ev-title">{{ ev(index).title }}</p><p class="ev-text">{{ ev(index).text }}</p>
          }
          @case ('list') {
            <p class="ev-title">{{ ev(index).title }}</p>
            <ul class="ev-list">@for (it of ev(index).listItems; track $index) { <li>{{ it }}</li> }</ul>
          }
          @case ('trace') {
            <p class="ev-title">{{ ev(index).title }}</p><pre class="ev-trace">{{ ev(index).traceLines.join('\n') }}</pre>
          }
          @case ('json') {
            <p class="ev-title">{{ ev(index).title }}</p><pre class="ev-json">{{ ev(index).jsonLines.join('\n') }}</pre>
          }
        }
        @if (isNew(ev(index))) { <span class="new-flag">NEW</span> }
      </td>
      <td class="col-seq"><span class="cell-seq">#{{ ev(index).seq.toLocaleString() }}</span></td>
    </ng-template>
  `,
})
export class TableStreamComponent implements OnDestroy {
  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<number>;

  readonly columns = STREAM_COLUMNS;
  readonly total = TOTAL;          // fixed — never grows, so the engine is not recreated
  baseSeq = TOTAL - 1;
  freshMinSeq = -1;
  follow = false;
  newAbove = 0;
  seen = TOTAL;
  stat = 'scroll down, then inject to test anchoring';
  live = false;

  readonly tableOptions: CeriousScrollOptions = {
    layout: 'table',
    table: { tableClassName: 'cs-table', columnWidths: [...STREAM_COLUMN_WIDTHS] },
  };
  readonly getItem = (i: number): number => i;

  private engine: any = null;
  private didInitialJump = false;
  private liveTimer: ReturnType<typeof setInterval> | null = null;

  // Memoize the event for (index, baseSeq): content slides when baseSeq changes.
  private _idx = -1;
  private _bs = -1;
  private _ev: StreamEvent | null = null;
  ev(index: number): StreamEvent {
    if (this._idx !== index || this._bs !== this.baseSeq || this._ev === null) {
      this._idx = index;
      this._bs = this.baseSeq;
      this._ev = makeEvent(this.baseSeq - index);
    }
    return this._ev;
  }
  ago(ev: StreamEvent): number { return this.baseSeq - ev.seq; }
  isNew(ev: StreamEvent): boolean { return this.freshMinSeq >= 0 && ev.seq >= this.freshMinSeq; }

  onReady(scroller: any): void {
    this.engine = scroller;
    if (!this.didInitialJump) {
      this.didInitialJump = true;
      requestAnimationFrame(() => { this.scroller?.jumpToElement(40); this.refreshStat(); });
    }
  }

  onViewport(v: CeriousViewportChangeDetail): void {
    const topSeqVisible = this.baseSeq - v.currentElement;
    this.stat = `top event #${topSeqVisible.toLocaleString()} · idx ${v.currentElement.toLocaleString()} · ${v.percentage.toFixed(1)}%`;
    if (v.currentElement === 0) this.newAbove = 0;
  }

  private refreshStat(): void {
    const eng = this.engine;
    if (!eng) return;
    const topSeqVisible = this.baseSeq - eng.currentElement;
    this.stat = `top event #${topSeqVisible.toLocaleString()} · idx ${eng.currentElement.toLocaleString()} · ${eng.scrollPercentage.toFixed(1)}%`;
    if (eng.currentElement === 0 && eng.scrollOffset <= 0) this.newAbove = 0;
  }

  prepend(k: number): void {
    const eng = this.engine;
    if (!eng) return;
    const anchorEl = eng.currentElement;
    const anchorOff = eng.scrollOffset;
    const wasAtTop = eng.currentElement === 0 && eng.scrollOffset <= 0;

    this.baseSeq += k;                          // k newer events enter at the top
    this.freshMinSeq = this.baseSeq - k + 1;    // mark the just-arrived batch NEW

    if (this.follow) {
      this.scroller?.jumpToElement(0);          // ride the newest
    } else {
      // Hold the same logical row (now at index anchorEl + k). jumpToElement syncs
      // the scrollbar thumb; restore scrollOffset for a crisp sub-row hold;
      // recalculate re-renders visible rows with the new baseSeq content + heights.
      const target = Math.min(anchorEl + k, TOTAL - 1);
      this.scroller?.jumpToElement(target);
      if (anchorOff > 0) eng.scrollOffset = anchorOff;
      if (!wasAtTop) this.newAbove += k;
    }
    this.scroller?.recalculate();
    this.seen = this.baseSeq + 1;
    this.refreshStat();
  }

  goTop(): void {
    this.scroller?.jumpToElement(0);
    this.newAbove = 0;
    this.refreshStat();
  }

  setFollow(on: boolean): void {
    this.follow = on;
    if (on) this.goTop();
  }

  toggleLive(): void {
    this.live = !this.live;
    if (this.live) {
      this.liveTimer = setInterval(() => this.prepend(1 + Math.floor(Math.random() * 3)), 1300);
    } else if (this.liveTimer) {
      clearInterval(this.liveTimer);
      this.liveTimer = null;
    }
  }

  ngOnDestroy(): void {
    if (this.liveTimer) clearInterval(this.liveTimer);
  }
}
