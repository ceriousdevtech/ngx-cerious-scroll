import { ApplicationConfig } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  // Hash routing keeps deep links / refresh working on static hosting (e.g.
  // GitHub Pages) and matches the React and Vue demo galleries.
  providers: [provideRouter(routes, withHashLocation())],
};
