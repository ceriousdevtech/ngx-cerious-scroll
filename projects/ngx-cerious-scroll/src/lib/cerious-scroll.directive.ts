import {
  AfterViewInit,
  ApplicationRef,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';

import {
  type CeriousScrollOptions,
  type ElementRenderer,
  type MeasuredViewportRange,
} from '@ceriousdevtech/cerious-scroll';
import { Subscription } from 'rxjs';

import type { CeriousViewportChangeDetail } from './cerious-scroll.types';
import type { CeriousScrollItemTemplateContext } from './cerious-scroll-item-template.directive';
import { type CeriousScrollHostRef, CeriousScrollService } from './cerious-scroll.service';

function coerceTotalElements(explicitTotal: number | null | undefined, itemsLen: number | null | undefined): number {
  const candidate = typeof explicitTotal === 'number' ? explicitTotal : typeof itemsLen === 'number' ? itemsLen : undefined;
  if (candidate === undefined || Number.isNaN(candidate)) {
    throw new Error('CeriousScrollDirective: provide `ceriousScrollTotalElements` or `ceriousScrollItems`.');
  }
  // CeriousScroll currently requires >= 1
  return Math.max(1, candidate);
}

@Directive({
  selector: '[ceriousScroll]',
  standalone: true,
})
export class CeriousScrollDirective<TItem = unknown> implements AfterViewInit, OnChanges, OnDestroy {
  /** Total number of items. If omitted, derived from `ceriousScrollItems.length`. */
  @Input() ceriousScrollTotalElements: number | null = null;

  /** Optional items array (enables `let-item`). */
  @Input() ceriousScrollItems: readonly TItem[] | null = null;

  /** Optional getter for large datasets (alternative to passing full `items`). */
  @Input() ceriousScrollGetItem: ((index: number) => TItem) | null = null;

  /** Template used to render each row. */
  @Input() ceriousScrollItemTemplate: TemplateRef<CeriousScrollItemTemplateContext<TItem>> | null = null;

  /** Options passed to `new CeriousScroll(...)`. */
  @Input() ceriousScrollOptions: CeriousScrollOptions = {};

  /** Automatically call render after each scroll event. Default: true */
  @Input() ceriousScrollAutoRender = true;

  /** Emits `cerious-viewport-change` detail. */
  @Output() ceriousScrollViewportChange = new EventEmitter<CeriousViewportChangeDetail>();

  /** Emits the last measured viewport after each render pass. */
  @Output() ceriousScrollMeasuredViewport = new EventEmitter<MeasuredViewportRange>();

  /** Emits once the underlying `CeriousScroll` instance is ready. */
  @Output() ceriousScrollReady = new EventEmitter<CeriousScrollHostRef['scroller']>();

  private hostRef: CeriousScrollHostRef | null = null;
  private viewportSub: Subscription | null = null;

  private readonly viewByContainer = new Map<HTMLElement, EmbeddedViewRef<CeriousScrollItemTemplateContext<TItem>>>();

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly appRef: ApplicationRef,
    private readonly ngZone: NgZone,
    private readonly cerious: CeriousScrollService
  ) {}

  ngAfterViewInit(): void {
    this.ensureInitialized();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.hostRef) return;

    if (changes['ceriousScrollItems'] || changes['ceriousScrollTotalElements']) {
      const total = coerceTotalElements(this.ceriousScrollTotalElements, this.ceriousScrollItems?.length ?? null);
      this.hostRef.scroller.totalElements = total;
      this.hostRef.scroller.clearAllCaches();
      if (this.ceriousScrollAutoRender) this.render();
    }

    if (changes['ceriousScrollOptions'] && !changes['ceriousScrollOptions'].firstChange) {
      // Options are consumed primarily at construction time.
      this.recreate();
    }
  }

  ngOnDestroy(): void {
    this.viewportSub?.unsubscribe();
    this.viewportSub = null;

    this.destroyAllViews();

    this.hostRef?.destroy();
    this.hostRef = null;
  }

  /** Imperatively trigger a render pass (uses `ceriousScrollItemTemplate`). */
  render(): MeasuredViewportRange | null {
    if (!this.hostRef) return null;
    const template = this.ceriousScrollItemTemplate;
    if (!template) return null;

    const hostContainer = this.host.nativeElement;
    const height = hostContainer.clientHeight || hostContainer.offsetHeight;
    const contentContainer = this.hostRef.contentElement;

    const renderer: ElementRenderer = (index, elementContainer) => {
      // Rendering must create Angular views inside the Angular zone.
      this.ngZone.run(() => {
        this.renderTemplateIntoContainer(template, index, elementContainer);
      });
    };

    const range = this.hostRef.scroller.renderViewport(height, contentContainer, renderer);
    this.ngZone.run(() => this.ceriousScrollMeasuredViewport.emit(range));
    return range;
  }

  private recreate(): void {
    this.viewportSub?.unsubscribe();
    this.viewportSub = null;

    this.destroyAllViews();

    this.hostRef?.destroy();
    this.hostRef = null;

    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    if (this.hostRef) return;

    const container = this.host.nativeElement;
    const total = coerceTotalElements(this.ceriousScrollTotalElements, this.ceriousScrollItems?.length ?? null);

    this.hostRef = this.cerious.createHost(container, total, this.ceriousScrollOptions, this.ngZone, () => {
      if (this.ceriousScrollAutoRender) this.render();
    });

    this.viewportSub = this.hostRef.viewportChanges$.subscribe((detail: CeriousViewportChangeDetail) => {
      this.ngZone.run(() => this.ceriousScrollViewportChange.emit(detail));
    });

    this.ceriousScrollReady.emit(this.hostRef.scroller);

    if (this.ceriousScrollAutoRender) {
      queueMicrotask(() => this.render());
    }
  }

  private getItemForIndex(index: number): TItem {
    const getter = this.ceriousScrollGetItem;
    if (getter) return getter(index);

    const items = this.ceriousScrollItems;
    if (!items) return undefined as TItem;

    return items[index];
  }

  private renderTemplateIntoContainer(
    template: TemplateRef<CeriousScrollItemTemplateContext<TItem>>,
    index: number,
    elementContainer: HTMLElement
  ): void {
    const previous = this.viewByContainer.get(elementContainer);
    if (previous) {
      this.appRef.detachView(previous);
      previous.destroy();
      this.viewByContainer.delete(elementContainer);
    }

    // Clear prior DOM (CeriousScroll may recycle containers).
    elementContainer.textContent = '';

    const item = this.getItemForIndex(index);
    const view = template.createEmbeddedView({ $implicit: item, item, index });
    this.appRef.attachView(view);
    view.detectChanges();

    for (const node of view.rootNodes) {
      elementContainer.appendChild(node);
    }

    this.viewByContainer.set(elementContainer, view);
  }

  private destroyAllViews(): void {
    for (const view of this.viewByContainer.values()) {
      this.appRef.detachView(view);
      view.destroy();
    }
    this.viewByContainer.clear();
  }
}
