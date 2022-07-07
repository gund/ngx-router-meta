import {
  ModuleWithProviders,
  NgModule,
  Optional,
  Provider,
  SkipSelf,
} from '@angular/core';

import { RouterMetaConfig, ROUTE_META_CONFIG } from './router-meta';
import { RouterMetaService } from './router-meta.service';

export type ConfigProvider = Provider;

export interface RouterMetaModuleConfig {
  config?: RouterMetaConfig;
  configProvider?: ConfigProvider;
}

@NgModule({})
export class RouterMetaModule {
  static forRoot(
    config: RouterMetaModuleConfig = {} as any,
  ): ModuleWithProviders<RouterMetaModule> {
    return {
      ngModule: RouterMetaModule,
      providers: [
        config.configProvider || {
          provide: ROUTE_META_CONFIG,
          useValue: config.config,
        },
      ],
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
