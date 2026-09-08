import { Routes } from '@angular/router';

import { GalleryComponent } from './gallery.component';
import { DEMOS } from './registry';
import { BenchmarkComponent } from './demos/benchmark.component';

export const routes: Routes = [
  { path: '', component: GalleryComponent },
  // Standalone: the benchmark is not one of the demos, so it is routed
  // directly rather than coming from the DEMOS registry.
  { path: 'benchmark', component: BenchmarkComponent },
  ...DEMOS.map((d) => ({ path: d.slug, component: d.component })),
  { path: '**', redirectTo: '' },
];
