import { Component, ViewChild } from '@angular/core';
import { CeriousScrollDirective, type CeriousScrollOptions } from 'ngx-cerious-scroll';
import { rand } from '../lib/random';

/**
 * Masonry with real content: network images, a composed card template, and an
 * interactive carousel.
 *
 * Three constraints follow from cards being rendered only while near the
 * viewport, and from the engine sizing a card before the browser lays it out:
 *
 *   1. Media space is reserved from intrinsic dimensions — a card that grows
 *      after mount is never re-measured, and overlaps its neighbour.
 *   2. Card height is enforced rather than estimated: the chrome below the
 *      image has a fixed height, so getItemHeight cannot disagree with the DOM.
 *   3. Per-card UI state lives on the component, keyed by index, because the
 *      template is re-created as cards scroll in and out.
 */
const RATIOS = [3 / 4, 4 / 3, 1, 9 / 16, 16 / 9, 2 / 3] as const;
const ITEM_COUNTS = [1_000, 50_000, 200_000] as const;
const AUTHORS = ['A. Lovelace', 'L. Torvalds', 'G. Hopper', 'A. Turing', 'M. Hamilton', 'R. Perlman'] as const;
const TAGS = ['landscape', 'portrait', 'street', 'studio', 'archive', 'macro'] as const;

/** Height of everything below the image. Enforced in CSS as well as declared here. */
const CHROME_H = 132;

interface CardModel {
  ratio: number;
  author: string;
  tag: string;
  likes: number;
  frames: number;
}

@Component({
  selector: 'demo-masonry-gallery',
  standalone: true,
  imports: [CeriousScrollDirective],
  styleUrl: './masonry.css',
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1>🖼️ Masonry · real content</h1>
        <p>
          Network images, a composed Angular template, and a carousel inside every multi-shot
          card — virtualized. Media space is reserved, chrome height is enforced, and per-card
          state is keyed by index so it survives the template being re-created.
        </p>
      </div>

      <div class="demo-toolbar">
        <label for="gallery-items">Items</label>
        <!-- [selected] on the option, not [value] on the select: Angular's
             property binding sets the select's value before its options exist,
             so the control renders showing the first option regardless. -->
        <select id="gallery-items" (change)="setTotal($any($event.target).value)">
          @for (count of itemCounts; track count) {
            <option [value]="count" [selected]="count === total">{{ count.toLocaleString() }}</option>
          }
        </select>
        <input #jump type="number" value="25000" />
        <button type="button" (click)="go(jump.value)">Go</button>
        <button type="button" (click)="scroller?.scrollToPercentage(0)">Top</button>
        <button type="button" (click)="scroller?.scrollToPercentage(100)">End</button>
        <span class="spacer"></span>
        <span class="stat">{{ stat }}</span>
      </div>

      <div class="demo-scroll masonry-scroll" ceriousScroll
           [ceriousScrollTotalElements]="total"
           [ceriousScrollGetItem]="getItem"
           [ceriousScrollItemTemplate]="card"
           [ceriousScrollOptions]="options"
           (ceriousScrollMeasuredViewport)="refresh()"></div>

      <ng-template #card let-index>
        <div class="gallery-card">
          <div class="gallery-card__media"
               [style.aspect-ratio]="'1 / ' + model(index).ratio"
               [style.background]="placeholder(index)">
            <img [src]="imageUrl(index, frameOf(index))"
                 [width]="bucket(columnWidth)"
                 [height]="round(bucket(columnWidth) * model(index).ratio)"
                 decoding="async" fetchpriority="high" alt=""
                 (load)="reveal($event)" />
            @if (model(index).frames > 1) {
              <button type="button" class="gallery-card__nav gallery-card__nav--prev"
                      aria-label="Previous image" (click)="step(index, -1)">‹</button>
              <button type="button" class="gallery-card__nav gallery-card__nav--next"
                      aria-label="Next image" (click)="step(index, 1)">›</button>
              <span class="gallery-card__dots">
                @for (k of frameList(index); track k) {
                  <i [class.is-on]="k === frameOf(index)"></i>
                }
              </span>
            }
          </div>

          <div class="gallery-card__chrome" [style.height.px]="chromeHeight">
            <div class="gallery-card__byline">
              <span class="gallery-card__avatar">{{ initial(index) }}</span>
              <span class="gallery-card__author">{{ model(index).author }}</span>
              <span class="gallery-card__badge">{{ model(index).tag }}</span>
            </div>
            <p class="gallery-card__title">
              Frame {{ index.toLocaleString() }} — {{ model(index).tag }} study,
              {{ model(index).frames > 1 ? model(index).frames + ' shots' : 'single shot' }}
            </p>
            <div class="gallery-card__actions">
              <button type="button" [class.is-liked]="isLiked(index)" (click)="toggleLike(index)">
                {{ isLiked(index) ? '♥' : '♡' }} {{ model(index).likes + (isLiked(index) ? 1 : 0) }}
              </button>
              <span>#{{ index.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </ng-template>

      <div class="demo-footer">
        <span>Total: <strong>{{ total.toLocaleString() }}</strong></span>
        <span>Determinism: <strong>canonical</strong></span>
        <span>Images: <strong>reserved + prefetched</strong></span>
      </div>
    </div>
  `,
})
export class MasonryGalleryComponent {
  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<number>;

  readonly itemCounts = ITEM_COUNTS;
  readonly chromeHeight = CHROME_H;
  readonly round = Math.round;
  total = 50_000;
  stat = 'scroll to see live stats';

  /** Live column width, captured from getItemHeight — the one callback reporting it. */
  columnWidth = 260;

  /**
   * Keyed by card index, not held on the rendered element: the template is
   * destroyed when a card leaves the window, so anything stored there is lost.
   */
  private readonly frameByCard = new Map<number, number>();
  private readonly likedCards = new Set<number>();
  private readonly warmed = new Set<number>();

  readonly getItem = (index: number) => index;

  readonly options: CeriousScrollOptions = {
    layout: 'masonry',
    wheel: { smooth: true, notchThresholdPx: Infinity },
    masonry: {
      getItemHeight: (index, width) => {
        this.columnWidth = width;
        return Math.round(width * this.model(index).ratio) + CHROME_H;
      },
      gap: 14,
      targetColumnWidth: 260,
      segmentSize: 500,
    },
  };

  model(index: number): CardModel {
    const frames = rand(index, 5) < 0.35 ? 2 + Math.floor(rand(index, 6) * 4) : 1;
    return {
      ratio: RATIOS[Math.floor(rand(index, 1) * RATIOS.length)],
      author: AUTHORS[Math.floor(rand(index, 2) * AUTHORS.length)],
      tag: TAGS[Math.floor(rand(index, 3) * TAGS.length)],
      likes: Math.floor(rand(index, 4) * 900),
      frames,
    };
  }

  initial(index: number): string {
    return this.model(index).author.split(' ')[1][0];
  }

  placeholder(index: number): string {
    return `hsl(${Math.floor(rand(index, 9) * 360)} 28% 22%)`;
  }

  /** Bucket the request width so a resizing CDN can cache it. */
  bucket(width: number): number {
    return Math.ceil(width / 100) * 100;
  }

  imageUrl(index: number, frame: number): string {
    const w = this.bucket(this.columnWidth);
    return `https://picsum.photos/seed/ncs${index}-${frame}/${w}/${Math.round(w * this.model(index).ratio)}`;
  }

  frameOf(index: number): number {
    return this.frameByCard.get(index) ?? 0;
  }

  frameList(index: number): number[] {
    return Array.from({ length: this.model(index).frames }, (_, k) => k);
  }

  step(index: number, delta: number): void {
    const frames = this.model(index).frames;
    this.frameByCard.set(index, (this.frameOf(index) + delta + frames) % frames);
  }

  isLiked(index: number): boolean {
    return this.likedCards.has(index);
  }

  toggleLike(index: number): void {
    if (this.likedCards.has(index)) this.likedCards.delete(index);
    else this.likedCards.add(index);
  }

  reveal(event: Event): void {
    (event.target as HTMLElement).classList.add('is-loaded');
  }

  refresh(): void {
    const engine = this.scroller?.scroller;
    if (!engine) return;
    this.stat = `${engine.scrollPercentage.toFixed(1)}% · ${this.warmed.size} images warmed`;
    // Small window only: a browser allows ~6 connections per host, so a large
    // speculative window queues ahead of the images actually on screen.
    const from = engine.startElement * 500;
    for (let i = from; i < from + 40; i++) this.warm(i);
  }

  private warm(index: number): void {
    if (index < 0 || index >= this.total || this.warmed.has(index)) return;
    this.warmed.add(index);
    const image = new Image();
    image.decoding = 'async';
    // Low priority so visible cards, which request at high priority, preempt these.
    image.fetchPriority = 'low';
    image.src = this.imageUrl(index, 0);
    if (this.warmed.size > 600) this.warmed.clear();
  }

  setTotal(value: string): void {
    this.total = Number(value);
  }

  go(value: string): void {
    const index = Number.parseInt(value, 10);
    if (Number.isFinite(index)) {
      this.scroller?.jumpToItem(Math.max(0, Math.min(this.total - 1, index)));
    }
    this.refresh();
  }
}
