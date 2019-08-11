import {
  ModuleWithProviders,
  NgModule,
  Optional,
  SkipSelf,
} from '@angular/core';

import { ROUTE_META_CONFIG, RouterMetaConfig } from './router-meta';
import { RouterMetaService } from './router-meta.service';
import { TypedProvider, TypedProviderI } from './typed-provider';

export type ConfigProvider = TypedProvider<typeof ROUTE_META_CONFIG>;

export interface RouterMetaModuleConfig<C extends ConfigProvider> {
  config?: RouterMetaConfig;
  configProvider?: C & TypedProviderI<typeof ROUTE_META_CONFIG, C>;
}

@NgModule({})
export class RouterMetaModule {
  static forRoot<C extends ConfigProvider>(
    config: RouterMetaModuleConfig<C> = {} as any,
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
