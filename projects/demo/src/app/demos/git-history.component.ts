import { Component, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import { GIT_TOTAL, makeCommit, type GitFile } from './git.data';

@Component({
  selector: 'demo-git-history',
  standalone: true,
  imports: [NgIf, CeriousScrollDirective],
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1>🌿 Commit History</h1>
        <p>{{ total.toLocaleString() }} commits — click any commit to expand its changed files.</p>
      </div>

      <div
        class="demo-scroll git-scroll"
        ceriousScroll
        [ceriousScrollTotalElements]="total"
        [ceriousScrollGetItem]="getItem"
        [ceriousScrollItemTemplate]="rowTpl"
      ></div>

      <ng-template #rowTpl let-i="index">
        <div class="commit" (click)="toggle(i)" *ngIf="commit(i) as c">
          <div class="commit__row">
            <span class="commit__avatar" [style.background]="c.author.color">{{ c.author.initials }}</span>
            <span class="commit__main">
              <div class="commit__msg">{{ c.message }}</div>
              <div class="commit__sub">
                <span class="commit__branch">{{ c.branch }}</span>
                <span>{{ c.author.name }}</span>
                <span class="commit__hash">{{ c.hash }}</span>
                <span>· {{ c.time }}</span>
              </div>
            </span>
            <span class="commit__stat">
              <span class="git-add">+{{ c.add }}</span> <span class="git-del">−{{ c.del }}</span>
            </span>
          </div>
          @if (expanded.has(i)) {
            <div class="commit__files">
              @for (f of c.files; track $index) {
                <div class="commit__file">
                  <span class="commit__file-name">{{ f.name }}</span>
                  <span class="git-add">+{{ f.add }}</span>
                  <span class="git-del">−{{ f.del }}</span>
                  <span class="commit__bar">
                    @for (a of aBars(f); track $index) { <i class="a"></i> }
                    @for (d of dBars(f); track $index) { <i class="d"></i> }
                  </span>
                </div>
              }
            </div>
          }
        </div>
      </ng-template>
    </div>
  `,
})
export class GitHistoryComponent {
  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<number>;

  readonly total = GIT_TOTAL;
  protected readonly commit = makeCommit;

  expanded = new Set<number>();
  readonly getItem = (i: number): number => i;

  toggle(i: number): void {
    const next = new Set(this.expanded);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    this.expanded = next;
    // Change detection re-renders the row (show/hide files); the engine's content
    // observer detects the height change and reflows. No recalculate.
  }

  aBars(f: GitFile): number[] {
    return Array(Math.min(5, Math.ceil(f.add / 18))).fill(0);
  }

  dBars(f: GitFile): number[] {
    return Array(Math.min(5, Math.ceil(f.del / 12))).fill(0);
  }
}
