import { Routes } from '@angular/router';
import { ImageGridComponent } from './features/image-grid/image-grid.component';
import { DetailsComponent } from './features/details/details.component';
import { ClustersComponent } from './features/clusters/clusters.component';
import { PerformanceComponent } from './features/performance/performance.component';
import { DebugComponent } from './features/debug/debug.component';

export const routes: Routes = [
  // Root: Image grid
  { path: '', component: ImageGridComponent },

  // Details page
  { path: 'details/:id', component: DetailsComponent, data: { renderMode: 'server' } },

  // Clusters
  { path: 'clusters', component: ClustersComponent },

  // Performance (CPU benchmark)
  { path: 'performance', component: PerformanceComponent },

  // Debug: hydration & memory logs
  { path: 'debug', component: DebugComponent },

  // Fallback: redirect to root for unknown routes
  { path: '**', redirectTo: '' },
];
