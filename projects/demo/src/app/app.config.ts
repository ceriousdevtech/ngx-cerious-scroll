import { ApplicationConfig } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  // Hash routing keeps deep links / refresh working on static hosting (e.g.
  // GitHub Pages) and matches the React and Vue demo galleries.
  // provideAnimations() is required by PrimeNG components (the PrimeNG Table
  // demo) — its overlays/sort UI rely on Angular animations.
  providers: [provideRouter(routes, withHashLocation()), provideAnimations()],
};
