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
  private scheduledRenderFrame: number | null = null;

  private readonly viewByContainer = new Map<HTMLElement, EmbeddedViewRef<CeriousScrollItemTemplateContext<TItem>>>();
  // Pool of views detached because their container left the viewport. Reusing
  // them on subsequent renders avoids destroying + recreating the entire row
  // component tree on fast scrolls (where the engine's element pool wipes
  // textContent on reused containers, so view rootNodes get orphaned).
  private readonly freeViews: EmbeddedViewRef<CeriousScrollItemTemplateContext<TItem>>[] = [];

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
      const countChanged = this.hostRef.scroller.totalElements !== total;

      if (countChanged) {
        // The dataset size changed: the ViewportRenderer stores its own copy of
        // totalElements (set by value at construction) so patching the engine's
        // public property alone leaves the renderer's internal bound stale.  The
        // renderer would then use the old count for its viewport-fill loop and
        // bottom-boundary scan, producing phantom renders at out-of-bounds
        // indices (undefined items → 0-height rows → the fill loop never
        // satisfies its height condition → hundreds of renderer callbacks).
        // Recreating the engine gives both the engine and the renderer a fresh,
        // consistent count.  ensureInitialized() schedules the first render via
        // queueMicrotask, which runs after the current CD cycle completes.
        this.recreate();
      } else if (this.ceriousScrollAutoRender) {
        // Same count, new data reference (e.g. an immutable edit or a sort that
        // happens to keep the same length). The engine reuses the DOM element it
        // already rendered for each overlapping index without re-invoking the
        // renderer, so update the content of every currently-visible row IN
        // PLACE before calling render().  This preserves each row's embedded
        // view (so a focused textbox keeps focus/caret) and does NOT discard
        // cached heights. If a row's height actually changes the engine's
        // ResizeObserver keeps the cache correct on its own; for a wholesale
        // height change across all rows, call recalculate() instead.
        this.refreshRenderedContent();
        this.render();
      }
    }

    if (changes['ceriousScrollOptions'] && !changes['ceriousScrollOptions'].firstChange) {
      // Options are consumed primarily at construction time.
      this.recreate();
    }
  }

  ngOnDestroy(): void {
    if (this.scheduledRenderFrame != null) {
      cancelAnimationFrame(this.scheduledRenderFrame);
      this.scheduledRenderFrame = null;
    }

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

    // Track whether the engine asked us to bind any row this pass. Pure scroll
    // frames where the visible row set doesn't change still drive render() via
    // the rAF coalescer — there's no point in walking the prune map or
    // emitting the viewport range when nothing was touched.
    let rendererInvocations = 0;
    const renderer: ElementRenderer = (index, elementContainer) => {
      rendererInvocations++;
      // Render each row's embedded view with LOCAL change detection
      // (`view.detectChanges()` inside `renderTemplateIntoContainer`) so the
      // engine can measure its height during this pass. Do NOT wrap each row in
      // its own `ngZone.run` — that fires a full `ApplicationRef` tick *per row*
      // (O(newRows × visibleRows) work, janky drags). The single coalesced tick
      // for the whole pass is handled by the caller (`scheduleRender`).
      this.renderTemplateIntoContainer(template, index, elementContainer);
    };

    const range = this.hostRef.scroller.renderViewport(height, contentContainer, renderer);

    if (rendererInvocations === 0) {
      // Viewport didn't change — skip the prune walk and the (potentially
      // zone-entering) emit.
      return range;
    }

    // Destroy views whose container the engine no longer renders. Without this,
    // every container the engine recycles into its element pool leaves its
    // embedded view attached to ApplicationRef forever — so the attached-view
    // list (and every O(n) `detachView`) grows without bound and scrolling gets
    // progressively slower. Mirrors the React/Vue wrappers, which drop rows that
    // fall out of `getRenderedIndices()`.
    this.pruneDetachedViews();

    // Only re-enter the zone (a global tick) if someone is actually listening.
    if (this.ceriousScrollMeasuredViewport.observed) {
      this.ngZone.run(() => this.ceriousScrollMeasuredViewport.emit(range));
    }
    return range;
  }

  /** Tear down embedded views whose container is no longer part of the viewport. */
  private pruneDetachedViews(): void {
    if (!this.hostRef || this.viewByContainer.size === 0) return;
    const scroller = this.hostRef.scroller;
    const active = new Set<HTMLElement>();
    for (const index of scroller.getRenderedIndices()) {
      const el = scroller.getRenderedElement(index);
      if (el) active.add(el);
    }
    for (const [container, view] of this.viewByContainer) {
      if (!active.has(container)) {
        // Detach DOM but keep the view alive in the pool for future reuse.
        // Destroying + recreating views per scroll step dominates frame time.
        for (const node of view.rootNodes) {
          if (node.parentNode) node.parentNode.removeChild(node);
        }
        this.viewByContainer.delete(container);
        this.freeViews.push(view);
      }
    }
  }

  /** Auto-render coalesced to at most once per animation frame. */
  private scheduleRender(): void {
    if (this.scheduledRenderFrame != null) return;
    this.scheduledRenderFrame = requestAnimationFrame(() => {
      this.scheduledRenderFrame = null;
      // Run render() OUTSIDE Angular's zone. A full ApplicationRef.tick() on
      // every scroll frame is the primary FPS bottleneck: even when no rows
      // change (pure translation), ngZone.run() causes Angular to walk the
      // entire component tree. Instead we call view.detectChanges() locally
      // inside renderTemplateIntoContainer for each affected row. Zone entry is
      // only needed when creating a brand-new embedded view (to zone-patch its
      // event listeners) — recycled and pooled views were already created inside
      // zone and their listeners remain zone-aware.
      this.render();
    });
  }

  /**
   * Discard all cached row heights and re-measure the viewport.
   *
   * Call this only when the heights of rows you've *already rendered* may have
   * changed without their indices changing — e.g. a global font/density change,
   * or swapping every row to a different layout. This forces a synchronous
   * re-measure (one `offsetHeight` read per visible row), so do NOT call it on
   * routine edits: a single cell edit keeps its row's size, and the engine's
   * ResizeObserver picks up any incidental resize on its own.
   */
  recalculate(): MeasuredViewportRange | null {
    if (!this.hostRef) return null;
    const template = this.ceriousScrollItemTemplate;
    if (template) {
      // Re-invoke the renderer for every currently-rendered row so pending
      // Angular bindings flush into the DOM and the engine re-measures each
      // row's new height into its cache. Without this, the engine's render
      // pass skips the renderer for already-rendered indices and falls
      // through to reading stale offsetHeight.
      this.hostRef.scroller.refreshVisible((index, elementContainer) => {
        this.renderTemplateIntoContainer(template, index, elementContainer);
      });
    }
    return this.render();
  }

  /** Jump directly to an element index, then render. */
  jumpToElement(index: number): MeasuredViewportRange | null {
    if (!this.hostRef) return null;
    this.hostRef.scroller.jumpToElement(index);
    return this.render();
  }

  /** Scroll to a percentage (0..100), then render. */
  scrollToPercentage(percentage: number): MeasuredViewportRange | null {
    if (!this.hostRef) return null;
    this.hostRef.scroller.handleScrollPercentage(percentage);
    return this.render();
  }

  /** Reset to the top, then render. */
  reset(): MeasuredViewportRange | null {
    if (!this.hostRef) return null;
    this.hostRef.scroller.reset();
    return this.render();
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
      // Coalesce scroll-driven renders to one per frame (the native scrollbar
      // can fire many scroll events between paints).
      if (this.ceriousScrollAutoRender) this.scheduleRender();
    });

    this.viewportSub = this.hostRef.viewportChanges$.subscribe((detail: CeriousViewportChangeDetail) => {
      // Skip the global tick when nobody is bound to the output.
      if (this.ceriousScrollViewportChange.observed) {
        this.ngZone.run(() => this.ceriousScrollViewportChange.emit(detail));
      }
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
      // Recycle: update the bound context and run local CD instead of
      // destroying the embedded view and rebuilding the entire row tree.
      const item = this.getItemForIndex(index);
      previous.context.$implicit = item;
      previous.context.item = item;
      previous.context.index = index;
      // The core engine wipes elementContainer.textContent when reusing it from
      // its pool, orphaning the view's root nodes. Re-append them defensively.
      if (previous.rootNodes.length && previous.rootNodes[0].parentNode !== elementContainer) {
        for (const node of previous.rootNodes) {
          elementContainer.appendChild(node);
        }
      }
      previous.detectChanges();
      return;
    }

    // Try to reuse a pooled view from a container that scrolled out of viewport.
    const pooled = this.freeViews.pop();
    if (pooled) {
      const item = this.getItemForIndex(index);
      pooled.context.$implicit = item;
      pooled.context.item = item;
      pooled.context.index = index;
      elementContainer.textContent = '';
      for (const node of pooled.rootNodes) {
        elementContainer.appendChild(node);
      }
      pooled.detectChanges();
      this.viewByContainer.set(elementContainer, pooled);
      return;
    }

    // No prior view for this container: create one.
    // Enter the Angular zone so the new view's template event listeners
    // ((click), (input), etc.) are zone-patched. This path runs at most
    // once per visible row (after that, the view is recycled from the pool).
    elementContainer.textContent = '';

    const item = this.getItemForIndex(index);
    const view = this.ngZone.run(() => {
      const v = template.createEmbeddedView({ $implicit: item, item, index });
      this.appRef.attachView(v);
      v.detectChanges();
      return v;
    });

    for (const node of view.rootNodes) {
      elementContainer.appendChild(node);
    }

    this.viewByContainer.set(elementContainer, view);
  }

  /**
   * Update the bound item/index on every currently-rendered row's embedded view
   * and run change detection, without recreating the views. Used when the data
   * reference changes but the visible indices (and their heights) do not, so row
   * state (focus, selection, open dropdowns) survives the update.
   */
  /**
   * Re-bind each currently rendered row's context (from the current items/getter)
   * and run change detection on its embedded view. Use this after mutating row
   * state in place (e.g. selection flags) or column-level state read by the row
   * template, when row identity and visible indices have not changed. Cheap
   * relative to `render()` — does not invoke the engine's measurement pass.
   */
  refreshRenderedContent(): void {
    if (!this.hostRef) return;
    const scroller = this.hostRef.scroller;

    for (const index of scroller.getRenderedIndices()) {
      const container = scroller.getRenderedElement(index);
      if (!container) continue;

      const view = this.viewByContainer.get(container);
      if (!view) continue;

      const item = this.getItemForIndex(index);
      view.context.$implicit = item;
      view.context.item = item;
      view.context.index = index;
      view.detectChanges();
    }
  }

  private destroyAllViews(): void {
    for (const view of this.viewByContainer.values()) {
      this.appRef.detachView(view);
      view.destroy();
    }
    this.viewByContainer.clear();
    for (const view of this.freeViews) {
      this.appRef.detachView(view);
      view.destroy();
    }
    this.freeViews.length = 0;
  }
}
