import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import { DemoIconComponent } from '../demo-icon.component';
import { DemoDocsComponent } from '../demo-docs.component';
import { SsrRowComponent } from './ssr-row.component';
import { SERVER_HTML, SERVER_ROWS, TOTAL } from './ssr.data';

@Component({
  selector: 'demo-ssr',
  standalone: true,
  imports: [FormsModule, CeriousScrollDirective, DemoIconComponent, DemoDocsComponent, SsrRowComponent],
  styleUrl: './ssr.css',
  // The server payload is a plain HTML string: it never passes through
  // Angular, so it carries no `_ngcontent-*` attribute and emulated
  // encapsulation's scoped selectors do not match it. The adopted rows would
  // render unstyled beside the client's own — which is exactly the mismatch
  // this demo exists to say does NOT happen. These styles have to be global.
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="demo-page" [class.ssr-page--stranded]="!hydrate">
      <div class="demo-page__header">
        <h1><demo-icon name="ssr" />SSR &amp; hydration</h1>
        <p>
          Eight rows rendered before the engine exists, then adopted rather than thrown away.
          Toggle hydration off to watch the engine build its own copy of every one, on top.
        </p>
      </div>

      <demo-docs
        feature="ssr.hydrate: adopting server-rendered rows instead of discarding them"
        docs="https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md#ssr-and-hydration-ssr"
        [code]="CODE"
      >
        <p intro>
          The package is import-safe without a DOM already: nothing touches <code>document</code> or
          <code>window</code> at module scope, so a server bundle can include it.
          <code>ssr.hydrate</code> adds the second half: on the first render the engine
          <em>adopts</em> the rows already in the container instead of clearing it. Rows are matched
          by <code>data-element-index</code>, so the server's output and the client's first render
          agree on identity. Turn it off and you can watch the alternative: the first frame has no
          record of those rows, so it renders its own on top of them and the server's work is
          stranded in the document. That duplication is what this exists to prevent.
        </p>
        <div notes>
          <h4>Worth knowing</h4>
          <ul>
            <li>
              <code>data-element-index</code> is the contract. A row without it cannot be matched
              and will be replaced.
            </li>
            <li>
              Render the row the same way on both sides. A server payload and a client render that
              disagree will shift on the first paint after adoption.
            </li>
            <li>
              Render enough rows server-side to cover the first viewport and no more: extras are
              adopted, then immediately recycled.
            </li>
            <li>
              Nothing in the module touches the DOM at import time, so the import itself is safe in
              a Node or edge runtime, and Angular Universal can render the list.
            </li>
          </ul>
        </div>
      </demo-docs>

      <div class="ssr-panel">
        <h3>What the server sent</h3>
        <pre class="ssr-markup">&lt;div data-cerious-scroll-content&gt;
  &lt;div data-element-index="0"&gt;…&lt;/div&gt;   {{ SERVER_ROWS }} rows, tinted blue below
  &lt;div data-element-index="1"&gt;…&lt;/div&gt;
&lt;/div&gt;</pre>
      </div>

      <div class="demo-toolbar">
        <label><input type="checkbox" [(ngModel)]="hydrate" (ngModelChange)="rebuild()" /> <code>ssr.hydrate</code></label>

        <button type="button" (click)="scroller?.reset()">Top</button>

        <span class="spacer"></span>
        <span class="stat">
          {{ hydrate ? 'the 8 server rows were adopted' : 'the 8 server rows are stranded under the engine’s own' }}
        </span>
      </div>

      @if (alive) {
        <!-- The container arrives with the server's HTML already in it: an
             innerHTML binding is applied during change detection, which is
             before the directive's own AfterViewInit builds the engine. That
             ordering is the whole point, since hydration only ever looks at the
             container on the very first render. -->
        <div
          class="demo-scroll"
          [innerHTML]="serverHtml"
          ceriousScroll
          [ceriousScrollTotalElements]="TOTAL"
          [ceriousScrollGetItem]="getItem"
          [ceriousScrollItemTemplate]="rowTpl"
          [ceriousScrollOptions]="options"
        ></div>
      }

      <ng-template #rowTpl let-index="index">
        <demo-ssr-row [index]="index" />
      </ng-template>

      <div class="demo-footer">
        <span>Server rows: <strong>{{ SERVER_ROWS }}</strong></span>
        <span>Hydration: <strong>{{ hydrate ? 'on' : 'off' }}</strong></span>
        <span>Dataset: <strong>{{ TOTAL.toLocaleString() }}</strong></span>
      </div>
    </div>
  `,
})
export class SsrHydrationComponent {
  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<number>;

  readonly TOTAL = TOTAL;
  readonly SERVER_ROWS = SERVER_ROWS;
  readonly getItem = (index: number): number => index;

  hydrate = true;
  alive = true;

  options: Record<string, unknown> = { ssr: { hydrate: true } };

  readonly CODE = `
// On the server (Angular Universal): each row inside an element carrying
// data-element-index, all inside data-cerious-scroll-content.

// On the client: adopt that markup instead of clearing it.
<div
  ceriousScroll
  [ceriousScrollTotalElements]="total"
  [ceriousScrollGetItem]="getItem"
  [ceriousScrollItemTemplate]="rowTpl"
  [ceriousScrollOptions]="{ ssr: { hydrate: true } }"
></div>
`;

  /**
   * The server payload, marked trusted.
   *
   * Angular's sanitizer drops attributes outside its allowlist, and
   * `data-element-index` is the contract the engine matches rows by, so a
   * sanitized payload would arrive with nothing to adopt.
   */
  readonly serverHtml: SafeHtml;

  constructor(sanitizer: DomSanitizer) {
    this.serverHtml = sanitizer.bypassSecurityTrustHtml(SERVER_HTML);
  }

  /** The engine reads its options once, at creation, so the toggle re-creates it. */
  rebuild(): void {
    this.options = { ssr: { hydrate: this.hydrate } };
    // Re-creating the element re-applies the innerHTML binding with it, so the
    // fresh engine sees a fresh payload.
    this.alive = false;
    setTimeout(() => (this.alive = true));
  }
}
