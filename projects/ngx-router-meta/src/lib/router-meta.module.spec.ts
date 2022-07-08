import { Provider } from '@angular/core';
import { createModule } from '@orchestrator/ngx-testing';

import { ROUTE_META_CONFIG } from './router-meta';
import { RouterMetaModule } from './router-meta.module';
import { RouterMetaService } from './router-meta.service';

describe('RouterMetaModule', () => {
  it('should exist', () => {
    expect(RouterMetaModule).toBeTruthy();
  });

  describe('static forRoot() method', () => {
    it('should return `RouterMetaModule` module', () => {
      const res = RouterMetaModule.forRoot();

      expect(res.ngModule).toBe(RouterMetaModule);
    });

    describe('with `config`', () => {
      it('should provide `ROUTE_META_CONFIG` as `useValue`', () => {
        const config = {};
        const res = RouterMetaModule.forRoot({ config });

        expect(res.providers).toContainEqual({
          provide: ROUTE_META_CONFIG,
          useValue: config,
        });
      });
    });

    describe('with `configProvider`', () => {
      it('should provide `configProvider` as is', () => {
        const configProvider = {} as Provider;
        const res = RouterMetaModule.forRoot({ configProvider });

        expect(res.providers).toContainEqual(configProvider);
      });
    });
  });

  describe('creation', () => {
    class RouterMetaServiceMock {
      // eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle, id-blacklist, id-match
      _setup = jest.fn();
    }

    it('should call `RouterMetaService._setup()` when parent `RouterMetaModule` NOT exists', async () => {
      const moduleRef = createModule(RouterMetaModule, [
        {
          provide: RouterMetaService,
          useClass: RouterMetaServiceMock,
          deps: [],
        },
      ]);

      const routerMetaService = moduleRef.injector.get<RouterMetaServiceMock>(
        RouterMetaService as any,
      );

      expect(routerMetaService._setup).toHaveBeenCalled();
    });

    it('should NOT call `RouterMetaService._setup()` when parent `RouterMetaModule` DOES exist', async () => {
      const moduleRef = createModule(RouterMetaModule, [
        { provide: RouterMetaModule, useValue: {} },
        {
          provide: RouterMetaService,
          useClass: RouterMetaServiceMock,
          deps: [],
        },
      ]);

      const routerMetaService = moduleRef.injector.get<RouterMetaServiceMock>(
        RouterMetaService as any,
      );

      expect(routerMetaService._setup).not.toHaveBeenCalled();
    });
  });
});
