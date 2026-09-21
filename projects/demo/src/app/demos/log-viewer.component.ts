import { Component, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import { buildLogOrder, LOG_LEVELS, makeLog, type LogLevel } from './log.data';

import { DemoIconComponent } from '../demo-icon.component';
import { DemoDocsComponent } from '../demo-docs.component';

@Component({
  selector: 'demo-log-viewer',
  standalone: true,
  imports: [NgIf, CeriousScrollDirective, DemoIconComponent, DemoDocsComponent],
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1><demo-icon name="logs" />Log Viewer</h1>
        <p>{{ order.length.toLocaleString() }} of 200,000 lines, filter by level, search the stream.</p>
      </div>

      <demo-docs
        [feature]="DOCS_FEATURE"
        [docs]="DOCS_LINK"
        [introHtml]="DOCS_INTRO"
        [notesHtml]="DOCS_NOTES"
        [code]="DOCS_CODE"
      />

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
  /** 'How to build this' panel. Prose shared with the vanilla demos. */
  readonly DOCS_FEATURE = "Filtering and searching a virtualized stream";
  readonly DOCS_LINK = "https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md";
  readonly DOCS_INTRO = "Filtering a virtual list is a question about your data, not about the scroller. The engine renders indices into whatever array you hand it, so a filter is: build the filtered view, tell the engine its new length, and repaint. The important detail is that an index means a position in the <em>current view</em>, so when the filter changes, every index changes meaning and <code>refresh()</code> is required even if the length happens to be the same.";
  readonly DOCS_NOTES = [
    "<code>refresh()</code> after a filter change is not optional; the recycler will not re-run your renderer for an index it already holds.",
    "For a live tail, append and follow only when the reader is already at the end.",
    "Highlighting a match is just markup in your renderer. There is nothing scroller-specific about it.",
    "Keep the filtered array around; the renderer is called often and should not be re-filtering per row.",
  ];
  readonly DOCS_CODE = `// Filtering is yours: hand the engine the rows that survive.
get visible(): Line[] {
  return this.lines.filter((l) => this.matchesLevel(l) && this.matchesQuery(l));
}

<div ceriousScroll [ceriousScrollItems]="visible" [ceriousScrollItemTemplate]="rowTpl"></div>`;

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
