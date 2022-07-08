import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RoutesWithMeta } from 'ngx-router-meta';

import { ShowRouteComponent } from './show-route.component';

const routes: RoutesWithMeta = [
  {
    path: '',
    component: ShowRouteComponent,
    data: {
      meta: {
        title: '{msg} - Messages ({count})',
        description: 'Check me out',
      },
    },
  },
  {
    path: 'route1',
    component: ShowRouteComponent,
    data: { meta: { title: 'Route 1 Page', 'custom:tag': 'Works!' } },
  },
  {
    path: 'route2',
    component: ShowRouteComponent,
  },
  {
    path: 'route3',
    component: ShowRouteComponent,
    data: { meta: { _templates_: { title: 'Custom format | {title}' } } },
  },
  {
    path: 'lazy',
    loadChildren: () => import('./lazy/lazy.module').then((m) => m.LazyModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
