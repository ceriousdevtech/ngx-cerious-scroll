import { ceriousViewportChange$ } from './cerious-scroll.observable';
import type { CeriousViewportChangeDetail } from './cerious-scroll.types';

describe('ceriousViewportChange$', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should create an observable', () => {
    const obs$ = ceriousViewportChange$(container);
    expect(obs$).toBeTruthy();
  });

  it('should emit cerious-viewport-change events', (done) => {
    const obs$ = ceriousViewportChange$(container);

    const detail: CeriousViewportChangeDetail = {
      percentage: 50,
      currentElement: 10,
      scrollOffset: 100,
      result: { element: 10, offset: 100 },
    };

    obs$.subscribe((emitted) => {
      expect(emitted).toEqual(detail);
      done();
    });

    const event = new CustomEvent('cerious-viewport-change', { detail });
    container.dispatchEvent(event);
  });

  it('should normalize viewport-change events from native scrollbar', (done) => {
    const obs$ = ceriousViewportChange$(container);

    obs$.subscribe((emitted) => {
      expect(emitted.percentage).toBe(75);
      expect(emitted.currentElement).toBe(20);
      expect(emitted.scrollOffset).toBe(250);
      expect(emitted.result.element).toBe(20);
      expect(emitted.result.offset).toBe(250);
      done();
    });

    const event = new CustomEvent('viewport-change', {
      detail: {
        percentage: 75,
        element: 20,
        scrollOffset: 250,
      },
    });
    container.dispatchEvent(event);
  });

  it('should merge both event types into single stream', (done) => {
    const obs$ = ceriousViewportChange$(container);

    const emissions: CeriousViewportChangeDetail[] = [];

    obs$.subscribe((emitted) => {
      emissions.push(emitted);

      if (emissions.length === 2) {
        expect(emissions[0].percentage).toBe(25);
        expect(emissions[1].percentage).toBe(60);
        done();
      }
    });

    const ceriousEvent = new CustomEvent('cerious-viewport-change', {
      detail: {
        percentage: 25,
        currentElement: 5,
        scrollOffset: 50,
        result: { element: 5, offset: 50 },
      },
    });
    container.dispatchEvent(ceriousEvent);

    const scrollbarEvent = new CustomEvent('viewport-change', {
      detail: {
        percentage: 60,
        element: 15,
        scrollOffset: 200,
      },
    });
    container.dispatchEvent(scrollbarEvent);
  });

  it('should share the observable among multiple subscribers', (done) => {
    const obs$ = ceriousViewportChange$(container);

    let subscriber1Emitted = false;
    let subscriber2Emitted = false;

    obs$.subscribe(() => {
      subscriber1Emitted = true;
      checkCompletion();
    });

    obs$.subscribe(() => {
      subscriber2Emitted = true;
      checkCompletion();
    });

    function checkCompletion() {
      if (subscriber1Emitted && subscriber2Emitted) {
        expect(subscriber1Emitted).toBe(true);
        expect(subscriber2Emitted).toBe(true);
        done();
      }
    }

    const event = new CustomEvent('cerious-viewport-change', {
      detail: {
        percentage: 10,
        currentElement: 1,
        scrollOffset: 10,
        result: { element: 1, offset: 10 },
      },
    });
    container.dispatchEvent(event);
  });
});