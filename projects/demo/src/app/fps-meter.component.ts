import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';

/**
 * Live frame-rate meter. Measures the *true* paint cadence with a
 * `requestAnimationFrame` loop: when the main thread is busy (e.g. a heavy
 * scroll render) frame callbacks are delayed and the number drops, so this
 * reflects how smoothly the scroller is actually running.
 *
 * The rAF loop runs OUTSIDE the Angular zone so it never triggers a global
 * change-detection tick per frame; we mark the view for check only twice a
 * second when the displayed number actually updates.
 */
@Component({
  selector: 'demo-fps-meter',
  standalone: true,
  template: `
    <span class="fps-meter" [class]="'fps-meter fps-meter--' + tier" title="Live frames per second">
      <span class="fps-meter__value">{{ fps }}</span>
      <span class="fps-meter__unit">FPS</span>
    </span>
  `,
})
export class FpsMeterComponent implements OnInit, OnDestroy {
  fps = 0;
  tier: 'good' | 'ok' | 'bad' = 'good';

  private raf = 0;
  private frames = 0;
  private last = 0;

  constructor(private readonly zone: NgZone, private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.last = performance.now();
      const loop = (now: number) => {
        this.frames++;
        const elapsed = now - this.last;
        if (elapsed >= 500) {
          this.fps = Math.round((this.frames * 1000) / elapsed);
          this.tier = this.fps >= 55 ? 'good' : this.fps >= 30 ? 'ok' : 'bad';
          this.frames = 0;
          this.last = now;
          // Reflect the new value without forcing a global tick every frame.
          this.cdr.detectChanges();
        }
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
  }
}
