import { Component, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import { buildLogOrder, LOG_LEVELS, makeLog, type LogLevel } from './log.data';

@Component({
  selector: 'demo-log-viewer',
  standalone: true,
  imports: [NgIf, CeriousScrollDirective],
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1>📜 Log Viewer</h1>
        <p>{{ order.length.toLocaleString() }} of 200,000 lines — filter by level, search the stream.</p>
      </div>

      <div class="demo-toolbar">
        @for (l of levels; track l) {
          <span class="chip" [class]="l" [class.active]="active.has(l)" (click)="toggle(l)">{{ l }}</span>
        }
        <input
          type="search"
          placeholder="Search messages…"
          [value]="query"
          (input)="onSearch($any($event.target).value)"
          style="flex: 1; min-width: 200px"
        />
        <span class="stat"><strong>{{ order.length.toLocaleString() }}</strong> lines</span>
      </div>

      <div
        class="demo-scroll log-scroll"
        ceriousScroll
        [ceriousScrollItems]="order"
        [ceriousScrollItemTemplate]="rowTpl"
      ></div>

      <ng-template #rowTpl let-item>
        <div class="log-row" *ngIf="item != null && log(item) as l">
          <span class="log-time">{{ l.time }}</span>
          <span class="log-level" [class]="l.level">{{ l.level }}</span>
          <span class="log-service">{{ l.service }}</span>
          <span class="log-msg">{{ l.message }}</span>
        </div>
      </ng-template>
    </div>
  `,
})
export class LogViewerComponent {
  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<number>;

  readonly levels = LOG_LEVELS;
  protected readonly log = makeLog;

  active = new Set<LogLevel>(LOG_LEVELS);
  query = '';
  order: number[] = buildLogOrder(this.active, '');

  private timer?: ReturnType<typeof setTimeout>;

  onSearch(value: string): void {
    this.query = value;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.rebuild(), 250);
  }

  toggle(level: LogLevel): void {
    const next = new Set(this.active);
    if (next.has(level)) next.delete(level);
    else next.add(level);
    this.active = next;
    this.rebuild();
  }

  private rebuild(): void {
    this.order = buildLogOrder(this.active, this.query);
    requestAnimationFrame(() => this.scroller?.jumpToElement(0));
  }
}
