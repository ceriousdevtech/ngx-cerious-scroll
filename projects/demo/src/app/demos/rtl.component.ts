import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CeriousScrollDirective,
  type CeriousViewportChangeDetail,
} from 'ngx-cerious-scroll';

import { DemoIconComponent } from '../demo-icon.component';
import { DemoDocsComponent } from '../demo-docs.component';
import { RtlRowComponent } from './rtl-row.component';
import type { Script } from './rtl.data';

const TOTAL = 200_000;

@Component({
  selector: 'demo-rtl',
  standalone: true,
  imports: [FormsModule, CeriousScrollDirective, DemoIconComponent, DemoDocsComponent, RtlRowComponent],
  styleUrl: './rtl.css',
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1><demo-icon name="rtl" />Right-to-left</h1>
        <p>
          Arabic and Hebrew content with the scrollbar on the leading edge and rows inset from the
          trailing edge. The direction is read from the host.
        </p>
      </div>

      <demo-docs
        feature="direction: 'auto': right-to-left, read from the host"
        docs="https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md#right-to-left-direction"
        [code]="CODE"
      >
        <p intro>
          RTL is not a mirrored stylesheet. The scrollbar moves to the left edge, the browser's own
          <code>scrollLeft</code> origin changes meaning, and any inset expressed as
          <code>left</code> or <code>right</code> ends up on the wrong side. The engine handles the
          scroll math and positions rows with <em>logical</em> insets
          (<code>inset-inline-start</code> / <code>inset-inline-end</code>) so the gutter it
          reserves for the scrollbar lands on whichever side the scrollbar is actually on.
          <code>direction: 'auto'</code> reads the computed direction off the host, so setting
          <code>dir</code> in your markup is enough.
        </p>
        <div notes>
          <h4>Worth knowing</h4>
          <ul>
            <li>
              Write your own row CSS with logical properties, <code>padding-inline-start</code>,
              <code>border-inline-end</code>, <code>margin-inline</code>, and it follows the
              direction for free.
            </li>
            <li>
              <code>text-align: start</code> rather than <code>left</code>; the whole point is that
              neither side is hard-coded.
            </li>
            <li>
              Mixing scripts is normal. Wrap left-to-right runs (numbers, reference codes, latin
              names) in their own element so the bidi algorithm does not reorder them oddly.
            </li>
            <li>
              <code>direction: 'auto'</code> is read once at mount. Flipping <code>dir</code> at
              runtime means re-creating the instance, which is what the toggle above does.
            </li>
          </ul>
        </div>
      </demo-docs>

      <div class="demo-toolbar">
        <label for="dir">Direction</label>
        <select id="dir" [(ngModel)]="dir" (ngModelChange)="rebuild()">
          <option value="rtl">rtl (scrollbar on the left)</option>
          <option value="ltr">ltr (scrollbar on the right)</option>
        </select>

        <label for="script">Script</label>
        <select id="script" [(ngModel)]="script" (ngModelChange)="rebuild()">
          <option value="ar">العربية</option>
          <option value="he">עברית</option>
        </select>

        <button type="button" (click)="scroller?.jumpToElement(100000)">Jump to the middle</button>

        <span class="spacer"></span>
        <span class="stat">
          {{ viewport ? 'row ' + viewport.currentElement.toLocaleString() : 'scroll the ledger' }}
        </span>
      </div>

      @if (alive) {
        <div
          class="demo-scroll"
          [dir]="dir"
          ceriousScroll
          [ceriousScrollTotalElements]="TOTAL"
          [ceriousScrollGetItem]="getItem"
          [ceriousScrollItemTemplate]="rowTpl"
          [ceriousScrollOptions]="options"
          (ceriousScrollViewportChange)="viewport = $event"
        ></div>
      }

      <ng-template #rowTpl let-index="index">
        <demo-rtl-row [index]="index" [script]="script" />
      </ng-template>

      <div class="demo-footer">
        <span>Rows: <strong>{{ TOTAL.toLocaleString() }}</strong></span>
        <span>Direction: <strong>{{ dir }}</strong></span>
        <span>Scrollbar: <strong>{{ dir === 'rtl' ? 'left edge' : 'right edge' }}</strong></span>
      </div>
    </div>
  `,
})
export class RtlComponent {
  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<number>;

  readonly TOTAL = TOTAL;
  readonly getItem = (index: number): number => index;

  dir: 'rtl' | 'ltr' = 'rtl';
  script: Script = 'ar';
  alive = true;
  viewport: CeriousViewportChangeDetail | null = null;

  readonly options: Record<string, unknown> = { direction: 'auto' };

  readonly CODE = `
<!-- The engine reads the host's own direction. Nothing else needs to know. -->
<div
  dir="rtl"
  ceriousScroll
  [ceriousScrollTotalElements]="total"
  [ceriousScrollGetItem]="getItem"
  [ceriousScrollItemTemplate]="rowTpl"
  [ceriousScrollOptions]="{
    // 'auto' reads the host's computed direction; 'ltr' / 'rtl' force it.
    direction: 'auto'
  }"
></div>
`;

  /**
   * `direction: 'auto'` is read once at mount, so flipping the host's `dir`
   * means re-creating the instance.
   */
  rebuild(): void {
    this.alive = false;
    setTimeout(() => (this.alive = true));
  }
}
