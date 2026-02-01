import { fromEvent, map, merge, Observable, share } from 'rxjs';

import type { ScrollResult } from '@ceriousdevtech/cerious-scroll';

import {
  CeriousNativeScrollbarViewportChangeEvent,
  CeriousViewportChangeDetail,
  CeriousViewportChangeEvent,
} from './cerious-scroll.types';

/**
 * Observable wrapper around the `cerious-viewport-change` CustomEvent emitted by `@ceriousdevtech/cerious-scroll`.
 *
 * Note: this event is emitted when wheel/touch/keyboard handlers are enabled (defaults are enabled).
 */
export function ceriousViewportChange$(container: HTMLElement): Observable<CeriousViewportChangeDetail> {
  const fromCerious = fromEvent<CeriousViewportChangeEvent>(container, 'cerious-viewport-change').pipe(
    map((evt) => evt.detail)
  );

  // Native scrollbar integration in the upstream package dispatches `viewport-change`.
  // Normalize it into the same shape as `cerious-viewport-change`.
  const fromScrollbar = fromEvent<CeriousNativeScrollbarViewportChangeEvent>(container, 'viewport-change').pipe(
    map((evt) => {
      const result: ScrollResult = { element: evt.detail.element, offset: evt.detail.scrollOffset };
      return {
        percentage: evt.detail.percentage,
        currentElement: evt.detail.element,
        scrollOffset: evt.detail.scrollOffset,
        result,
      } satisfies CeriousViewportChangeDetail;
    })
  );

  return merge(fromCerious, fromScrollbar).pipe(share());
}
