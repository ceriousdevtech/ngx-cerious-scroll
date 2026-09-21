import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CeriousScrollDirective,
  type InfiniteLoadContext,
} from 'ngx-cerious-scroll';

import { DemoIconComponent } from '../demo-icon.component';
import { DemoDocsComponent } from '../demo-docs.component';
import { makePage, type Post, PAGE, FIRST_PAGE, MAX_ROWS } from './infinite.data';

@Component({
  selector: 'demo-infinite',
  standalone: true,
  imports: [FormsModule, CeriousScrollDirective, DemoIconComponent, DemoDocsComponent],
  styleUrl: './infinite.css',
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1><demo-icon name="infinite" />Infinite loading</h1>
        <p>
          Asks for the next page as the end comes into range and grows the dataset in place, so the
          camera never moves. Asks once per approach, even while a slow fetch is still open.
        </p>
      </div>

      <demo-docs
        feature="infinite.onLoadMore: grow the dataset without moving the camera"
        docs="https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md#edge-triggered-loading-infinite"
        [code]="CODE"
      >
        <p intro>
          Thin sugar over the engine's in-place dataset growth, which already does the hard part:
          re-anchoring both native surfaces so the camera does not move. This option only decides
          <em>when</em> to ask. It fires once per approach and re-arms only when the window moves
          back out of the threshold, so a callback that loads nothing cannot spin. Return a promise
          and no further call is made until it settles, which is what keeps a slow fetch from being
          requested five times on the way down.
        </p>
        <div notes>
          <h4>Worth knowing</h4>
          <ul>
            <li>
              Return the promise. A callback that fires and forgets is re-armed as soon as it
              returns, and a slow endpoint will be asked again on the next frame.
            </li>
            <li>
              In Angular you grow the dataset by assigning a longer array to the bound input; the
              directive grows the engine in place and the camera stays where it is.
            </li>
            <li>
              The recycler will not re-run the item template for an index it already holds, so
              replacing a placeholder at the SAME index needs the item reference to change.
            </li>
            <li>
              With <code>edges: 'both'</code>, prepending needs the row heights to stay honest: see
              the prepend &amp; anchoring demo for the scroll-anchoring half.
            </li>
          </ul>
        </div>
      </demo-docs>

      <div class="feed-panel">
        <h3>Request log</h3>
        <div class="feed-log">
          @for (line of log; track $index) {
            <div>{{ line }}</div>
          }
        </div>
      </div>

      <div class="demo-toolbar">
        <label for="lat">Endpoint latency</label>
        <select id="lat" [(ngModel)]="latency">
          <option [ngValue]="0">instant</option>
          <option [ngValue]="400">400ms</option>
          <option [ngValue]="1500">1.5s (slow)</option>
        </select>

        <button type="button" (click)="scroller?.reset()">Top</button>
        <button type="button" (click)="scroller?.scrollToPercentage(100)">End</button>

        <span class="spacer"></span>
        <span class="stat">
          {{ loading ? 'loading…' : exhausted ? 'end of feed' : 'scroll to the end' }}
        </span>
      </div>

      <div
        class="demo-scroll"
        ceriousScroll
        [ceriousScrollTotalElements]="total"
        [ceriousScrollGetItem]="getItem"
        [ceriousScrollItemTemplate]="rowTpl"
        [ceriousScrollOptions]="options"
      ></div>

      <ng-template #rowTpl let-item>
        @if (item) {
          <div class="feed-item">
            <span class="feed-dot" [style.background]="'hsl(' + item.hue + ' 62% 62%)'"></span>
            <div class="feed-body">
              <div class="feed-head">
                <span class="feed-who">{{ item.who }}</span>
                <span class="feed-batch">page {{ item.batch }}</span>
                <span class="feed-when">{{ item.minutes }}m</span>
              </div>
              <p class="feed-text">{{ item.text }}</p>
            </div>
          </div>
        } @else {
          <div class="feed-loading">
            @if (exhausted) {
              <span>That is everything.</span>
            } @else {
              <span class="feed-spinner"></span>
              <span>Loading more…</span>
            }
          </div>
        }
      </ng-template>

      <div class="demo-footer">
        <span>Rows loaded: <strong>{{ posts.length.toLocaleString() }}</strong></span>
        <span>Pages: <strong>{{ batch }}</strong></span>
        <span>Threshold: <strong>20 rows</strong></span>
      </div>
    </div>
  `,
})
export class InfiniteFeedComponent {
  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<Post | null>;

  posts: Post[] = makePage(0, FIRST_PAGE, 1);
  loading = false;
  log: string[] = ['ready'];
  latency = 400;
  batch = 1;

  readonly getItem = (index: number): Post | null => this.posts[index] ?? null;

  readonly options: Record<string, unknown> = {
    infinite: { threshold: 20, edges: 'end', onLoadMore: (ctx: InfiniteLoadContext) => this.onLoadMore(ctx) },
  };

  readonly CODE = `
posts = firstPage();

onLoadMore(ctx) {
  // ctx = { direction, first, last, total }
  // Returning the promise is what suppresses repeat calls while the
  // request is still open.
  return fetch('/api/posts?after=' + cursor)
    .then((r) => r.json())
    .then((page) => {
      // The camera stays exactly where it is.
      this.posts = this.posts.concat(page.items);
    });
}

<div
  ceriousScroll
  [ceriousScrollTotalElements]="total"
  [ceriousScrollGetItem]="getItem"
  [ceriousScrollItemTemplate]="rowTpl"
  [ceriousScrollOptions]="{
    infinite: {
      threshold: 20,   // rows from the edge that trigger a load
      edges: 'end',    // or 'both' to backfill upwards too
      onLoadMore: (ctx) => this.onLoadMore(ctx)
    }
  }"
></div>
`;

  get exhausted(): boolean {
    return this.posts.length >= MAX_ROWS;
  }

  /**
   * A tail row that says "loading" is a REAL dataset row, so it is recycled and
   * positioned like everything else. A floating overlay would have to be kept
   * in sync with the scroll position by hand.
   *
   * It exists only while a request is open, or once there is nothing left. Kept
   * permanently, a slow scroll to the bottom parks on a spinner that is not
   * waiting for anything.
   */
  get total(): number {
    return this.posts.length + (this.loading || this.exhausted ? 1 : 0);
  }

  private note(line: string): void {
    this.log = [line, ...this.log].slice(0, 12);
  }

  private onLoadMore(ctx: InfiniteLoadContext): void | Promise<unknown> {
    if (this.batch * PAGE + FIRST_PAGE > MAX_ROWS) {
      this.note(`asked at row ${ctx.last} · nothing left`);
      return;
    }

    this.batch += 1;
    this.loading = true;
    this.note(`asked at row ${ctx.last} of ${ctx.total} · page ${this.batch}`);

    // Returning the promise is what suppresses repeat calls while the request
    // is still open. A callback that fires and forgets is re-armed the moment
    // it returns, and a slow endpoint gets asked again on the very next frame.
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.posts = this.posts.concat(makePage(this.posts.length, PAGE, this.batch));
        this.note(`  ↳ +${PAGE} rows, now ${this.posts.length}`);
        this.loading = false;

        // Re-bind what is already on screen.
        //
        // The row that was the tail spinner keeps that index; it is now a real
        // post. The recycler does NOT re-run the item template for an index it
        // already holds, so without this the spinner stays on screen until that
        // row happens to be recycled, which a slow scroll never forces. React
        // and Vue re-render it on their own because the bound item changed
        // identity; Angular's embedded views only re-evaluate when asked.
        this.scroller?.refreshRenderedContent();

        resolve();
      }, this.latency);
    });
  }
}
