import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DEMOS } from './registry';

@Component({
  selector: 'demo-gallery',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="gallery">
      <!-- Standalone: the benchmark is not a demo card, it measures them. -->
      <a class="feature" [routerLink]="['/', 'benchmark']">
        <div class="feature__main">
          <span class="feature__tag">Live benchmark</span>
          <h1 class="feature__title">Measure it yourself</h1>
          <p class="feature__blurb">
            Not a demo. A reproducible harness that runs in your browser and measures the
            <code>ceriousScroll</code> directive itself, so the numbers include Angular's own
            rendering. Compared against the same rows rendered with a plain &#64;for and no
            virtualiser. Export the numbers as CSV, JSON or Markdown.
          </p>
          <span class="feature__cta">Open the benchmark →</span>
        </div>
        <div class="feature__facts">
          <div><b>1K → 10M</b><span>dataset sweep</span></div>
          <div><b>4 → 61</b><span>DOM nodes per row</span></div>
          <div><b>Control group</b><span>unvirtualized &#64;for</span></div>
        </div>
      </a>

      <p class="gallery__lead">
        High-performance virtual scrolling across real-world UIs — every row is measured (never
        estimated), with O(1) memory. Pick a demo:
      </p>
      <div class="gallery__grid">
        @for (d of demos; track d.slug) {
          <a class="demo-card" [routerLink]="['/', d.slug]">
            <div class="demo-card__emoji">{{ d.emoji }}</div>
            <div class="demo-card__title">{{ d.title }}</div>
            <p class="demo-card__blurb">{{ d.blurb }}</p>
          </a>
        }
      </div>
    </div>
  `,
})
export class GalleryComponent {
  readonly demos = DEMOS;
}
