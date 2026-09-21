import { Component, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import { GIT_TOTAL, makeCommit, type GitFile } from './git.data';

import { DemoIconComponent } from '../demo-icon.component';
import { DemoDocsComponent } from '../demo-docs.component';

@Component({
  selector: 'demo-git-history',
  standalone: true,
  imports: [NgIf, CeriousScrollDirective, DemoIconComponent, DemoDocsComponent],
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1><demo-icon name="git" />Commit History</h1>
        <p>{{ total.toLocaleString() }} commits, click any commit to expand its changed files.</p>
      </div>

      <demo-docs
        [feature]="DOCS_FEATURE"
        [docs]="DOCS_LINK"
        [introHtml]="DOCS_INTRO"
        [notesHtml]="DOCS_NOTES"
        [code]="DOCS_CODE"
      />

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
  /** 'How to build this' panel. Prose shared with the vanilla demos. */
  readonly DOCS_FEATURE = "Rows that change height when you expand them";
  readonly DOCS_LINK = "https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md";
  readonly DOCS_INTRO = "A commit row is one line until you click it, and then it is however tall its file list makes it. This is the case that breaks scrollers built on estimated heights, and it is straightforward here: expansion is state in your data, the renderer draws the row at its current state, and the engine measures whatever comes out. The only requirement is to tell the engine that the row it already has mounted needs drawing again.";
  readonly DOCS_NOTES = [
    "<code>refresh()</code> is what re-measures. The recycler will not re-run the renderer for a mounted index on its own.",
    "Expansion state must live outside the DOM, or it will be recycled onto the wrong commit.",
    "Rows below the expanded one move down; the camera stays on the row the reader is on.",
    "Animating the expansion is fine, but the row must be at its final height when the renderer returns: animate after, or measure the end state.",
  ];
  readonly DOCS_CODE = `// Expanding a row changes its height. Keep the flag outside the row and
// let the engine's ResizeObserver pick up the new size.
open = new Set<string>();

<ng-template #rowTpl let-c>
  <app-commit [commit]="c" [open]="open.has(c.sha)" (toggle)="toggle(c.sha)" />
</ng-template>`;

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
