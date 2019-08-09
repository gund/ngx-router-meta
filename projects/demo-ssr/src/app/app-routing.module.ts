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
        title: '{msg} | Message ({count})',
        description: 'Check me out',
      },
    },
  },
  {
    path: 'route1',
    component: ShowRouteComponent,
    data: { meta: { title: 'Route 1 Page', 'custom:tag': 'Works!' } },
  },
  { path: 'route2', component: ShowRouteComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
