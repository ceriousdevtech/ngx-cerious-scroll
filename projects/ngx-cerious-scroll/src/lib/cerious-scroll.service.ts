import { Injectable, NgZone } from '@angular/core';

import { CeriousScroll, type CeriousScrollOptions } from '@ceriousdevtech/cerious-scroll';
import { Observable } from 'rxjs';

import { ceriousViewportChange$ } from './cerious-scroll.observable';
import type { CeriousViewportChangeDetail } from './cerious-scroll.types';

const CONTENT_ATTR = 'data-cerious-scroll-content';

function ensureContentElement(container: HTMLElement): HTMLElement {
  const existing = container.querySelector<HTMLElement>(`[${CONTENT_ATTR}]`);
  if (existing) return existing;

  const el = document.createElement('div');
  el.setAttribute(CONTENT_ATTR, '');
  el.style.position = 'relative';
  el.style.width = '100%';
  el.style.height = '100%';
  el.style.overflow = 'hidden';
  container.appendChild(el);
  return el;
}

@Injectable({
  providedIn: 'root'
})
export class CeriousScrollService {
  createHost(
    container: HTMLElement,
    totalElements: number,
    options: CeriousScrollOptions,
    ngZone: NgZone,
    onScrollHook?: () => void
  ): CeriousScrollHostRef {
    const contentElement = ensureContentElement(container);
    let scroller!: CeriousScroll;

    ngZone.runOutsideAngular(() => {
      const userOnScroll = options?.onScroll;
      const mergedOptions: CeriousScrollOptions = {
        ...options,
        onScroll: () => {
          userOnScroll?.();
          onScrollHook?.();
        },
      };

      scroller = new CeriousScroll(container, totalElements, mergedOptions);
    });

    const viewportChanges$ = ceriousViewportChange$(container);

    return {
      scroller,
      contentElement,
      viewportChanges$,
      destroy: () => {
        // Remove rendered rows content first; keep container stable.
        contentElement.textContent = '';
        scroller.detachScrollbar(container);
        scroller.dispose();
      },
    };
  }
}

export interface CeriousScrollHostRef {
  readonly scroller: CeriousScroll;
  /** Dedicated element used for row rendering (prevents scrollbar DOM from being cleared). */
  readonly contentElement: HTMLElement;
  readonly viewportChanges$: Observable<CeriousViewportChangeDetail>;
  destroy(): void;
}
