import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DEMOS } from './registry';

@Component({
  selector: 'demo-gallery',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="gallery">
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
