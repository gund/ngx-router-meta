import {
  ModuleWithProviders,
  NgModule,
  Optional,
  SkipSelf,
} from '@angular/core';

import { ROUTE_META_CONFIG, RouterMetaConfig } from './router-meta';
import { RouterMetaService } from './router-meta.service';

@NgModule({})
export class RouterMetaModule {
  static forRoot(
    config: RouterMetaConfig = {},
  ): ModuleWithProviders<RouterMetaModule> {
    return {
      ngModule: RouterMetaModule,
      providers: [{ provide: ROUTE_META_CONFIG, useValue: config }],
    };
  }

  constructor(
    @Optional() @SkipSelf() parentModule: RouterMetaModule,
    routerMetaService: RouterMetaService,
  ) {
    if (!parentModule) {
      routerMetaService._setup();
    }
  }
}
