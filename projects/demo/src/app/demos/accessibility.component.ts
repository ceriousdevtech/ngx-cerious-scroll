import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CeriousScrollDirective,
  type CeriousViewportChangeDetail,
} from 'ngx-cerious-scroll';

import { DemoIconComponent } from '../demo-icon.component';
import { DemoDocsComponent } from '../demo-docs.component';
import { rand } from '../lib/random';

const TOTAL = 1_000_000;
const KINDS = ['Report', 'Invoice', 'Contract', 'Memo', 'Transcript', 'Statement'];
const TAGS = ['archived', 'signed', 'draft', 'final', 'shared'];

@Component({
  selector: 'demo-accessibility',
  standalone: true,
  imports: [FormsModule, CeriousScrollDirective, DemoIconComponent, DemoDocsComponent],
  styleUrl: './accessibility.css',
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1 id="a11y-heading"><demo-icon name="accessibility" />Accessibility</h1>
        <p>
          Virtualization hides the dataset from screen readers. Compare what a reader actually
          announces, with and without the ARIA the engine writes.
        </p>
      </div>

      <demo-docs
        feature="aria.enabled: telling a screen reader the size of a dataset it cannot see"
        docs="https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md#screen-reader-semantics-aria"
        [code]="CODE"
      >
        <p intro>
          Virtualization is invisible to a screen reader in the worst way: it reads the DOM, the DOM
          holds twenty rows, so it announces &ldquo;item 3 of 20&rdquo; for a dataset of a million.
          <code>aria-setsize</code> and <code>aria-posinset</code> are the standard repair, stating
          the real size and position independently of what is mounted, and the engine already knows
          both numbers. It is opt-in because the correct markup depends on what your rows
          <em>mean</em>: a list of cards wants <code>list</code>/<code>listitem</code>, while a real
          <code>&lt;table&gt;</code> already carries its semantics and must not have roles layered
          over it.
        </p>
        <div notes>
          <h4>Worth knowing</h4>
          <ul>
            <li>
              Each mounted row gets <code>aria-setsize</code> (the real total) and
              <code>aria-posinset</code> (its true 1-based index), not its position in the DOM.
            </li>
            <li>
              Do not set <code>role</code> for <code>layout: 'table'</code>. Real table elements
              already announce correctly, and a role replaces that rather than adding to it.
            </li>
            <li>
              Keyboard navigation is a separate option (<code>keyboard</code>); ARIA describes the
              list, it does not make it focusable.
            </li>
            <li>
              Prefer <code>labelledBy</code> when a visible heading already names the region. It
              keeps one source of truth.
            </li>
          </ul>
        </div>
      </demo-docs>

      <div class="demo-toolbar">
        <label><input type="checkbox" [(ngModel)]="ariaOn" (ngModelChange)="rebuild()" /> Write ARIA semantics</label>

        <button type="button" (click)="scroller?.jumpToElement(40111)">Jump to row 40,112</button>
        <button type="button" (click)="scroller?.reset()">Top</button>

        <span class="spacer"></span>
        <span class="stat">
          {{ viewport ? 'top row ' + viewport.currentElement.toLocaleString() : 'scroll the list' }}
        </span>
      </div>

      <div class="sr-panel">
        <div class="sr-cell">
          <h3>What a reader announces</h3>
          <div class="sr-say" [class.sr-good]="setsize" [class.sr-bad]="!setsize">
            @if (setsize) {
              &ldquo;{{ titleFor(viewport?.currentElement ?? 0) }}, {{ posinset }} of
              {{ (+setsize).toLocaleString() }}&rdquo;
            } @else {
              &ldquo;{{ titleFor(viewport?.currentElement ?? 0) }}, 1 of {{ domRows }}&rdquo;:
              counted from the DOM, not the data
            }
          </div>
        </div>
        <div class="sr-cell">
          <h3>On the first mounted row</h3>
          <div class="sr-attrs">
            @if (setsize) {
              aria-setsize="{{ setsize }}" aria-posinset="{{ posinset }}"
            } @else {
              no aria-setsize / aria-posinset written
            }
          </div>
        </div>
        <div class="sr-cell">
          <h3>Rows in the DOM</h3>
          <div class="sr-attrs">{{ domRows }} of {{ TOTAL.toLocaleString() }}</div>
        </div>
      </div>

      @if (alive) {
        <div
          class="demo-scroll"
          ceriousScroll
          [ceriousScrollTotalElements]="TOTAL"
          [ceriousScrollGetItem]="getItem"
          [ceriousScrollItemTemplate]="rowTpl"
          [ceriousScrollOptions]="options"
          (ceriousScrollViewportChange)="viewport = $event"
          (ceriousScrollMeasuredViewport)="readBack()"
        ></div>
      }

      <ng-template #rowTpl let-index="index">
        <div class="a11y-row">
          <span class="a11y-idx">#{{ (index + 1).toLocaleString() }}</span>
          <span class="a11y-title">{{ titleFor(index) }}</span>
          <span class="a11y-tag">{{ tagFor(index) }}</span>
        </div>
      </ng-template>

      <div class="demo-footer">
        <span>Dataset: <strong>{{ TOTAL.toLocaleString() }}</strong></span>
        <span>ARIA: <strong>{{ ariaOn ? 'on' : 'off' }}</strong></span>
        <span>Named by: <strong>{{ ariaOn ? 'the page heading' : 'nothing' }}</strong></span>
      </div>
    </div>
  `,
})
export class AccessibilityComponent {
  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<number>;

  readonly TOTAL = TOTAL;
  readonly getItem = (index: number): number => index;

  ariaOn = true;
  alive = true;
  viewport: CeriousViewportChangeDetail | null = null;

  /** Read back off the DOM, so it reflects what the engine actually wrote. */
  setsize: string | null = null;
  posinset: string | null = null;
  domRows = 0;

  options: Record<string, unknown> = this.buildOptions();

  readonly CODE = `
<h1 id="results-heading">Search results</h1>

<div
  ceriousScroll
  [ceriousScrollTotalElements]="1000000"
  [ceriousScrollGetItem]="getItem"
  [ceriousScrollItemTemplate]="rowTpl"
  [ceriousScrollOptions]="{
    aria: {
      enabled: true,

      // Defaults: 'list' / 'listitem' for absolute and masonry layouts.
      // For layout: 'table' neither is set, <tr>/<td> already mean row
      // and cell, and a role on top would override real semantics.
      role: 'list',
      itemRole: 'listitem',

      // Name the region, by text or by an existing visible heading.
      labelledBy: 'results-heading'
      // label: 'Search results'
    }
  }"
></div>
`;

  titleFor(index: number): string {
    return `${KINDS[Math.floor(rand(index, 3) * KINDS.length)]} #${(index + 1).toLocaleString()}`;
  }

  tagFor(index: number): string {
    return TAGS[Math.floor(rand(index, 11) * TAGS.length)];
  }

  /**
   * Read the attributes off the first mounted row rather than recomputing them.
   *
   * The point of the panel is to show what the engine put in the DOM, and a
   * separate simulation could agree with the docs while the DOM did not. It is
   * driven by the render pass, because on the first render a lifecycle hook
   * would run before any row existed.
   */
  readBack(): void {
    const host = document.querySelector('.demo-scroll');
    const first = host?.querySelector('[data-element-index]') as HTMLElement | null;
    this.setsize = first?.getAttribute('aria-setsize') ?? null;
    this.posinset = first?.getAttribute('aria-posinset') ?? null;
    this.domRows = host?.querySelectorAll('[data-element-index]').length ?? 0;
  }

  private buildOptions(): Record<string, unknown> {
    return {
      aria: {
        enabled: this.ariaOn,
        role: 'list',
        itemRole: 'listitem',
        labelledBy: 'a11y-heading',
      },
    };
  }

  /** The engine reads its options once, at creation, so the toggle re-creates it. */
  rebuild(): void {
    this.options = this.buildOptions();
    this.setsize = null;
    this.posinset = null;
    this.alive = false;
    setTimeout(() => (this.alive = true));
  }
}
