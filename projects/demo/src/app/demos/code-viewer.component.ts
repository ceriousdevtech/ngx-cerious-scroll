import { Component, ViewChild } from '@angular/core';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import { CODE_TOTAL, firstMatch, makeLine, tokenize } from './code.data';

import { DemoIconComponent } from '../demo-icon.component';
import { DemoDocsComponent } from '../demo-docs.component';

@Component({
  selector: 'demo-code-viewer',
  standalone: true,
  imports: [CeriousScrollDirective, DemoIconComponent, DemoDocsComponent],
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1><demo-icon name="code" />Code Viewer</h1>
        <p>{{ total.toLocaleString() }} syntax-highlighted lines with line numbers and find.</p>
      </div>

      <demo-docs
        [feature]="DOCS_FEATURE"
        [docs]="DOCS_LINK"
        [introHtml]="DOCS_INTRO"
        [notesHtml]="DOCS_NOTES"
        [code]="DOCS_CODE"
      />

      <div class="demo-toolbar">
        <input
          type="search"
          placeholder="Find in file…"
          [value]="find"
          (input)="find = $any($event.target).value"
          (keydown.enter)="runFind()"
          style="flex: 1; min-width: 220px"
        />
        <button type="button" (click)="runFind()">Find next ↵</button>
        <button type="button" (click)="scroller?.reset()">Top</button>
        <span class="stat">{{ total.toLocaleString() }} lines</span>
      </div>

      <div
        class="demo-scroll code-scroll"
        ceriousScroll
        [ceriousScrollTotalElements]="total"
        [ceriousScrollGetItem]="getItem"
        [ceriousScrollItemTemplate]="rowTpl"
      ></div>

      <ng-template #rowTpl let-i="index">
        <div class="code-row" [class.match]="isMatch(i)">
          <span class="code-gutter">{{ i + 1 }}</span>
          <span class="code-text">@for (t of toks(i); track $index) {<span [class]="'tok-' + t.type">{{ t.text }}</span>}</span>
        </div>
      </ng-template>
    </div>
  `,
})
export class CodeViewerComponent {
  /** 'How to build this' panel. Prose shared with the vanilla demos. */
  readonly DOCS_FEATURE = "Fixed-height lines and jump-to-line";
  readonly DOCS_LINK = "https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md";
  readonly DOCS_INTRO = "Source code is the friendly case: every line is the same height, so the layout is entirely predictable and jumping to a line is exact. It is also the case where recycling discipline matters most, because each line is cheap and the renderer runs constantly: building a DOM tree per line will show up long before the scrolling does. Syntax highlighting is markup your renderer produces; the scroller neither knows nor cares.";
  readonly DOCS_NOTES = [
    "Reusing child nodes instead of clearing and rebuilding is the single biggest win in a renderer this hot.",
    "Highlight once into a cache if it is expensive; the renderer may be called many times for the same line.",
    "Uniform line height means the engine can skip per-row measurement: keep it uniform and do not let wrapping in.",
    "<code>white-space: pre</code> plus a horizontal scroller beats wrapping, which would make every line a different height.",
  ];
  readonly DOCS_CODE = `<div ceriousScroll [ceriousScrollItems]="lines" [ceriousScrollItemTemplate]="rowTpl"></div>

<ng-template #rowTpl let-line let-index="index">
  <div class="line">
    <span class="gutter">{{ index + 1 }}</span>
    <span [innerHTML]="line.html"></span>
  </div>
</ng-template>

// this.scroller?.jumpToElement(lineNumber - 1)`;

  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<number>;

  readonly total = CODE_TOTAL;
  find = '';

  readonly getItem = (i: number): number => i;
  readonly toks = (i: number) => tokenize(makeLine(i).raw);

  isMatch(i: number): boolean {
    const q = this.find.trim().toLowerCase();
    return q.length > 0 && makeLine(i).raw.toLowerCase().includes(q);
  }

  runFind(): void {
    const i = firstMatch(this.find);
    if (i >= 0) this.scroller?.jumpToElement(i);
  }
}
