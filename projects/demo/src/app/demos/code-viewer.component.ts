import { Component, ViewChild } from '@angular/core';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import { CODE_TOTAL, firstMatch, makeLine, tokenize } from './code.data';

@Component({
  selector: 'demo-code-viewer',
  standalone: true,
  imports: [CeriousScrollDirective],
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1>👨‍💻 Code Viewer</h1>
        <p>{{ total.toLocaleString() }} syntax-highlighted lines with line numbers and find.</p>
      </div>

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
