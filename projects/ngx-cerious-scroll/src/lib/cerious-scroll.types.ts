import type {
  CeriousScrollOptions as CoreCeriousScrollOptions,
  MasonryOptions,
  ScrollResult,
} from '@ceriousdevtech/cerious-scroll';

/** Engine options adapted for Angular-owned Masonry rendering. */
export type CeriousScrollOptions = Omit<CoreCeriousScrollOptions, 'masonry'> & {
  masonry?: Omit<MasonryOptions, 'renderItem'> & {
    /** Accepted for backward compatibility; Angular supplies the active renderer. */
    renderItem?: MasonryOptions['renderItem'];
  };
};

/**
 * Detail payload for the `cerious-viewport-change` CustomEvent dispatched by `@ceriousdevtech/cerious-scroll`.
 */
export interface CeriousViewportChangeDetail {
  /** Scroll percentage from 0..100 */
  percentage: number;

  /** Current top-most element index (as tracked by CeriousScroll) */
  currentElement: number;

  /** Pixel offset within `currentElement` */
  scrollOffset: number;

  /** Scroll operation result (element + offset) */
  result: ScrollResult;
}

export type CeriousViewportChangeEvent = CustomEvent<CeriousViewportChangeDetail>;

/**
 * Payload used by CeriousScroll's native scrollbar integration.
 * (Dispatched as `viewport-change` in the upstream package.)
 */
export interface CeriousNativeScrollbarViewportChangeDetail {
  percentage: number;
  element: number;
  scrollOffset: number;
}

export type CeriousNativeScrollbarViewportChangeEvent = CustomEvent<CeriousNativeScrollbarViewportChangeDetail>;
