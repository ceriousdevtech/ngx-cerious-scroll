import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

import { initAnalytics, trackPageView } from './analytics';

import { FpsMeterComponent } from './fps-meter.component';

@Component({
  selector: 'demo-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, FpsMeterComponent],
  template: `
    <div class="shell">
      <header class="topbar">
        <a class="topbar__brand" routerLink="/">CeriousScroll <small>Angular demos</small></a>
        <div class="topbar__spacer"></div>
        <demo-fps-meter />
        <a class="topbar__link" routerLink="/">← All demos</a>
        <a class="topbar__link topbar__link--accent" routerLink="/benchmark">Benchmark</a>
        <a
          class="topbar__link"
          href="https://www.npmjs.com/package/@ceriousdevtech/ngx-cerious-scroll"
          target="_blank"
          rel="noreferrer"
          >npm ↗</a
        >
      </header>
      <main class="content"><router-outlet /></main>
    </div>
  `,
})
export class AppComponent {
  private readonly router = inject(Router);

  constructor() {
    initAnalytics();
    // Hash routing means GA4's automatic page_view only ever sees the landing
    // page, so every route change is reported explicitly.
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => trackPageView(e.urlAfterRedirects));
  }
}
