import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CeriousScrollDirective,
  type CeriousViewportChangeDetail,
} from 'ngx-cerious-scroll';

import { DemoIconComponent } from '../demo-icon.component';
import { DemoDocsComponent } from '../demo-docs.component';
import { buildContacts, type ContactRow } from './sticky-snap.data';

@Component({
  selector: 'demo-sticky-snap',
  standalone: true,
  imports: [FormsModule, CeriousScrollDirective, DemoIconComponent, DemoDocsComponent],
  styleUrl: './sticky-snap.css',
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1><demo-icon name="sticky" />Sticky &amp; Snap</h1>
        <p>
          Section headers pinned outside the recycler, so they survive the moment their own row
          scrolls away, plus a camera that settles on a whole row when you stop.
        </p>
      </div>

      <demo-docs
        feature="sticky.resolve + snap: pinned section headers and a camera that settles"
        docs="https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md#pinned-section-headers-sticky"
        [code]="CODE"
      >
        <p intro>
          Two independent options that happen to pair well. <code>sticky</code> pins one dataset row
          to the top of the viewport while you are inside its section: the pinned element is drawn
          <em>outside</em> the recycler, so it survives the moment its own row scrolls out of the
          mounted window. <code>snap</code> settles the camera on a row boundary after scrolling
          stops, which is nearly free here because the camera is already
          <code>(element, offset)</code> and snapping is driving <code>offset</code> to zero. CSS
          scroll-snap cannot do this job: the surface the browser actually scrolls is a featureless
          spacer with no snap targets on it.
        </p>
        <div notes>
          <h4>Worth knowing</h4>
          <ul>
            <li>
              <code>resolve</code> runs on every window move. A linear scan over a few hundred
              sections is fine; a scan over the whole dataset is not.
            </li>
            <li>
              The pinned row goes through your normal item template, so it must be idempotent. It is
              drawn in two places at once.
            </li>
            <li>
              In Angular the pinned header's embedded view is exempted from the recycler's prune
              pass. That is what stops it blanking the moment its row leaves the window.
            </li>
            <li>
              Snapping fires after <code>scrollend</code>, so it never fights an in-flight gesture
              or its momentum.
            </li>
          </ul>
        </div>
      </demo-docs>

      <div class="demo-toolbar">
        <label><input type="checkbox" [(ngModel)]="stickyOn" (ngModelChange)="rebuild()" /> Pinned headers</label>
        <label><input type="checkbox" [(ngModel)]="snapOn" (ngModelChange)="rebuild()" /> Snap on stop</label>

        <label for="align">Align</label>
        <select id="align" [(ngModel)]="align" (ngModelChange)="rebuild()" [disabled]="!snapOn">
          <option value="nearest">nearest</option>
          <option value="start">start</option>
        </select>

        <button type="button" (click)="scroller?.reset()">Top</button>
        <button type="button" (click)="scroller?.jumpToElement(middle)">Middle</button>

        <span class="spacer"></span>
        <span class="stat">
          {{
            viewport
              ? 'row ' + viewport.currentElement.toLocaleString() + ' of ' + rows.length.toLocaleString()
              : rows.length.toLocaleString() + ' rows'
          }}
        </span>
      </div>

      @if (alive) {
        <div
          class="demo-scroll"
          ceriousScroll
          [ceriousScrollItems]="rows"
          [ceriousScrollItemTemplate]="rowTpl"
          [ceriousScrollOptions]="options"
          (ceriousScrollViewportChange)="viewport = $event"
        ></div>
      }

      <!-- A real element at the template root, not a bare control-flow block.
           An &#64;if at the root gives the embedded view nothing but anchor
           comments as its root nodes, and the 'sticky' header is populated by
           re-parenting a view into a different element, which moves the anchors
           and leaves the content behind. A wrapper with 'display: contents'
           costs no layout and gives the view something real to carry. -->
      <ng-template #rowTpl let-item>
        <div style="display: contents">
          @if (item.kind === 'head') {
            <div class="sg-head">
              <span class="sg-flag">{{ item.letter }}</span>
              <span class="sg-head__count">{{ item.count }} contacts</span>
            </div>
          } @else {
            <div class="sg-row">
              <span class="sg-avatar" [style.background]="'hsl(' + item.hue + ' 62% 62%)'">
                {{ item.first[0] }}{{ item.last[0] }}
              </span>
              <span>
                <span class="sg-name">{{ item.first }} {{ item.last }}</span>
                <br />
                <span class="sg-sub">{{ item.first.toLowerCase() }}&#64;example.com</span>
              </span>
              <span class="sg-meta">seen {{ item.seen }}d ago</span>
            </div>
          }
        </div>
      </ng-template>

      <div class="demo-footer">
        <span>Pinned header: <strong>{{ stickyOn ? 'on' : 'off' }}</strong></span>
        <span>Snap: <strong>{{ snapOn ? align : 'off' }}</strong></span>
        <span>Rows: <strong>{{ rows.length.toLocaleString() }}</strong></span>
      </div>
    </div>
  `,
})
export class StickySnapComponent {
  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<ContactRow>;

  private readonly built = buildContacts();
  readonly rows = this.built.rows;
  private readonly sectionOf = this.built.sectionOf;
  readonly middle = Math.floor(this.built.rows.length / 2);

  stickyOn = true;
  snapOn = true;
  align: 'nearest' | 'start' = 'nearest';
  viewport: CeriousViewportChangeDetail | null = null;

  /** Toggled off and on to re-create the directive: options are read once. */
  alive = true;

  options: Record<string, unknown> = this.buildOptions();

  readonly CODE = `
// Section header indices, ascending.
const { rows, sectionOf } = buildContacts();

<div
  ceriousScroll
  [ceriousScrollItems]="rows"
  [ceriousScrollItemTemplate]="rowTpl"
  [ceriousScrollOptions]="{
    sticky: {
      // Given the first visible row, return the index to pin, or null.
      // Called on every window move, so keep it cheap.
      resolve: (index) => sectionOf[index] ?? null,
      className: 'is-pinned'
    },
    snap: {
      enabled: true,
      align: 'nearest',   // or 'start' to always settle to the row's top
      tolerance: 2        // px of slack; skips the nudge when already landed
    }
  }"
></div>
`;

  private buildOptions(): Record<string, unknown> {
    return {
      // The pinned header is resolved from the FIRST VISIBLE row: "which
      // section am I inside right now?"
      sticky: this.stickyOn
        ? { resolve: (index: number) => this.sectionOf[index] ?? null, className: 'is-pinned' }
        : undefined,
      snap: { enabled: this.snapOn, align: this.align },
    };
  }

  /**
   * Re-create the scroller.
   *
   * The engine reads its options once, at creation, so toggling a feature means
   * a fresh instance. An app that does not change these at runtime never needs
   * this.
   */
  rebuild(): void {
    this.options = this.buildOptions();
    this.alive = false;
    setTimeout(() => (this.alive = true));
  }
}
