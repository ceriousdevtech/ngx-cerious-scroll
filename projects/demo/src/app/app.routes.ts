import { Routes } from '@angular/router';

import { GalleryComponent } from './gallery.component';
import { DEMOS } from './registry';

export const routes: Routes = [
  { path: '', component: GalleryComponent },
  ...DEMOS.map((d) => ({ path: d.slug, component: d.component })),
  { path: '**', redirectTo: '' },
];
