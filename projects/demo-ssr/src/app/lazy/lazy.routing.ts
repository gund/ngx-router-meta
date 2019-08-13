import { RouterModule } from '@angular/router';
import { RoutesWithMeta } from 'ngx-router-meta';

import { LazyComponent } from './lazy.component';

const routes: RoutesWithMeta = [
  {
    path: '',
    component: LazyComponent,
    data: { meta: { title: 'Lazy Title' } },
  },
  {
    path: 'child1',
    component: LazyComponent,
    data: { meta: { title: 'Lazy Child #1 Title' } },
  },
  {
    path: 'child2',
    component: LazyComponent,
    data: { meta: { title: 'Lazy Child #2 Title' } },
  },
];

export const LazyRoutesModule = RouterModule.forChild(routes);
