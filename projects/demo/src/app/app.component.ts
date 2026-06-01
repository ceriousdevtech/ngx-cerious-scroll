import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

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
export class AppComponent {}
