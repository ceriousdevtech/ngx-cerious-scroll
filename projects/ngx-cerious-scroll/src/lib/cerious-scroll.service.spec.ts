import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CeriousScrollService } from './cerious-scroll.service';

describe('CeriousScrollService', () => {
  let service: CeriousScrollService;
  let container: HTMLElement;
  let ngZone: NgZone;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CeriousScrollService);
    ngZone = TestBed.inject(NgZone);

    container = document.createElement('div');
    container.style.width = '400px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createHost', () => {
    it('should create a host with scroller and content element', () => {
      const options = {
        wheel: { enabled: false },
        touch: { enabled: false },
        keyboard: { enabled: false },
        attachScrollbar: false,
        autoResize: false,
        observeContentChanges: false,
      };

      const hostRef = service.createHost(container, 100, options, ngZone);

      expect(hostRef).toBeTruthy();
      expect(hostRef.scroller).toBeTruthy();
      expect(hostRef.contentElement).toBeTruthy();
      expect(hostRef.viewportChanges$).toBeTruthy();
      expect(hostRef.destroy).toBeTruthy();

      hostRef.destroy();
    });

    it('should create or reuse content element with correct attributes', () => {
      const options = {
        wheel: { enabled: false },
        touch: { enabled: false },
        keyboard: { enabled: false },
        attachScrollbar: false,
        autoResize: false,
        observeContentChanges: false,
      };

      const hostRef = service.createHost(container, 10, options, ngZone);

      expect(hostRef.contentElement.hasAttribute('data-cerious-scroll-content')).toBe(true);
      expect(hostRef.contentElement.style.position).toBe('relative');
      expect(hostRef.contentElement.style.width).toBe('100%');
      expect(hostRef.contentElement.style.height).toBe('100%');
      expect(hostRef.contentElement.style.overflow).toBe('hidden');

      hostRef.destroy();
    });

    it('should reuse existing content element on subsequent calls', () => {
      const options = {
        wheel: { enabled: false },
        touch: { enabled: false },
        keyboard: { enabled: false },
        attachScrollbar: false,
        autoResize: false,
        observeContentChanges: false,
      };

      const hostRef1 = service.createHost(container, 10, options, ngZone);
      const contentEl1 = hostRef1.contentElement;
      hostRef1.destroy();

      const hostRef2 = service.createHost(container, 10, options, ngZone);
      const contentEl2 = hostRef2.contentElement;

      expect(contentEl2).toBe(contentEl1);

      hostRef2.destroy();
    });

    it('should invoke onScrollHook when provided', (done) => {
      let hookCalled = false;
      const onScrollHook = () => {
        hookCalled = true;
        expect(hookCalled).toBe(true);
        hostRef.destroy();
        done();
      };

      const options = {
        wheel: { enabled: true, emitViewportChangeEvent: true },
        touch: { enabled: false },
        keyboard: { enabled: false },
        attachScrollbar: false,
        autoResize: false,
        observeContentChanges: false,
      };

      const hostRef = service.createHost(container, 100, options, ngZone, onScrollHook);

      // Simulate a wheel event outside Angular zone
      ngZone.runOutsideAngular(() => {
        const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
        container.dispatchEvent(wheelEvent);
      });

      setTimeout(() => {
        if (!hookCalled) {
          hostRef.destroy();
          fail('onScrollHook was not invoked');
        }
      }, 100);
    });

    it('should set totalElements on the scroller', () => {
      const options = {
        wheel: { enabled: false },
        touch: { enabled: false },
        keyboard: { enabled: false },
        attachScrollbar: false,
        autoResize: false,
        observeContentChanges: false,
      };

      const totalElements = 250;
      const hostRef = service.createHost(container, totalElements, options, ngZone);

      expect(hostRef.scroller.totalElements).toBe(totalElements);

      hostRef.destroy();
    });

    it('should clean up on destroy', () => {
      const options = {
        wheel: { enabled: false },
        touch: { enabled: false },
        keyboard: { enabled: false },
        attachScrollbar: false,
        autoResize: false,
        observeContentChanges: false,
      };

      const hostRef = service.createHost(container, 10, options, ngZone);
      const contentEl = hostRef.contentElement;

      contentEl.innerHTML = '<div>Test content</div>';

      hostRef.destroy();

      expect(contentEl.textContent).toBe('');
    });
  });
});
