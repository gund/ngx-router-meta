import { ɵPLATFORM_SERVER_ID } from '@angular/common';
import { Component, NgZone, PLATFORM_ID, Provider } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Meta, Title, TransferState } from '@angular/platform-browser';
import { provideRoutes, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import {
  ROUTE_META_CONFIG,
  RouterMetaConfig,
  RoutesWithMeta,
} from './router-meta';
import { RouterMetaContextService } from './router-meta-context.service';
import { RouterMetaService } from './router-meta.service';
import { AnyFunction } from './typed-provider';

@Component({ selector: 'nrm-dummy', template: '' })
class DummyComponent {}

class TitleMock {
  getTitle = jest.fn();
  setTitle = jest.fn();
}

class MetaMock {
  updateTag = jest.fn();
  removeTag = jest.fn();
}

class RouterMetaContextServiceMock {
  getContext = jest.fn().mockReturnValue(of({}));
  // eslint-disable-next-line @typescript-eslint/naming-convention,no-underscore-dangle,id-blacklist,id-match
  _processContext = jest.fn().mockImplementation((ctx) => ctx);
  // eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle, id-blacklist, id-match
  _templateStr = jest.fn().mockImplementation((str) => `tpl_${str}`);
}

describe('RouterMetaService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [DummyComponent],
      providers: [
        RouterMetaService,
        { provide: Title, useClass: TitleMock },
        { provide: Meta, useClass: MetaMock },
        {
          provide: RouterMetaContextService,
          useClass: RouterMetaContextServiceMock,
        },
        provideRouteMetaConfig({}),
      ],
    }),
  );

  describe('getOriginalTitle() method', () => {
    it('should return value from `Title.getTitle()`', () => {
      getTitleMock().getTitle.mockReturnValue('some title');

      const res = getService().getOriginalTitle();

      expect(res).toBe('some title');
    });

    describe('when `TransferState` available', () => {
      it('should call `TransferState.get()` with [makeStateKey(RouterMetaTitle), Title.getTitle()]', () => {
        const transferStateMock = {
          get: jest.fn().mockReturnValue('transferred title'),
        };

        TestBed.configureTestingModule({
          providers: [{ provide: TransferState, useValue: transferStateMock }],
        });

        const title = getTitleMock();
        title.getTitle.mockReturnValue('some title');

        const res = getService().getOriginalTitle();

        expect(res).toBe('transferred title');
        expect(title.getTitle).toHaveBeenCalled();
        expect(transferStateMock.get).toHaveBeenCalledWith(
          'RouterMetaTitle',
          'some title',
        );
      });
    });

    describe('_setup() method', () => {
      describe('when `TransferState` available and platform is server', () => {
        it('should call `TransferState.set()` with [makeStateKey(RouterMetaTitle), this.originalTitle]', () => {
          const transferStateMock = {
            set: jest.fn(),
            get: (_: unknown, t: string) => t,
          };

          TestBed.configureTestingModule({
            providers: [
              { provide: PLATFORM_ID, useValue: ɵPLATFORM_SERVER_ID },
              { provide: TransferState, useValue: transferStateMock },
            ],
          });

          const title = getTitleMock();
          title.getTitle.mockReturnValue('original title');

          getService()._setup();

          expect(title.getTitle).toHaveBeenCalled();
          expect(transferStateMock.set).toHaveBeenCalledWith(
            'RouterMetaTitle',
            'original title',
          );
        });
      });

      it('should NOT call `TransferState.set()` normally', () => {
        const transferStateMock = {
          set: jest.fn(),
          get: (_: unknown, t: string) => t,
        };

        TestBed.configureTestingModule({
          providers: [
            { provide: PLATFORM_ID, useValue: 'not server' },
            { provide: TransferState, useValue: transferStateMock },
          ],
        });

        const title = getTitleMock();
        title.getTitle.mockReturnValue('original title');

        getService()._setup();

        expect(transferStateMock.set).not.toBeCalled();
      });

      describe('title meta', () => {
        it('should update title from route data using `RouterMetaContextService._templateStr()`', fakeAsync(() => {
          TestBed.configureTestingModule({
            providers: [
              provideRoutesWithMeta([
                {
                  path: '',
                  component: DummyComponent,
                  data: { meta: { title: 'Main title' } },
                },
                {
                  path: 'child1',
                  component: DummyComponent,
                  data: { meta: { title: 'Child1 title' } },
                },
              ]),
            ],
          });

          runInZone(() => getRouter().initialNavigation());

          const title = getTitleMock();

          getService()._setup();
          tick();

          expect(title.setTitle).toHaveBeenCalledWith('tpl_Main title');

          runInZone(() => getRouter().navigateByUrl('/child1'));
          tick();

          expect(title.setTitle).toHaveBeenCalledWith('tpl_Child1 title');
        }));

        it(
          'should call `RouterMetaContextService._templateStr()` with ' +
            '[title, context, {templates, allMeta, name: `title`}]',
          fakeAsync(() => {
            TestBed.configureTestingModule({
              providers: [
                provideRoutesWithMeta([
                  {
                    path: '',
                    component: DummyComponent,
                    data: {
                      meta: {
                        title: 'title',
                        otherMeta: 'true',
                        _templates_: { __customTpls: '' },
                      },
                    },
                  },
                ]),
              ],
            });

            runInZone(() => getRouter().initialNavigation());

            const customContext = { __customCtx: true };

            const ctxService = getRouterMetaContextServiceMock();
            ctxService.getContext.mockReturnValue(of(customContext));

            getService()._setup();
            tick();

            expect(ctxService._templateStr).toHaveBeenCalledWith(
              'title',
              customContext,
              {
                name: 'title',
                templates: { __customTpls: '' },
                meta: { otherMeta: 'true', title: 'title' },
              },
            );
          }),
        );

        it('should set original title if route does not have meta', fakeAsync(() => {
          TestBed.configureTestingModule({
            providers: [
              provideRoutesWithMeta([
                {
                  path: '',
                  component: DummyComponent,
                  data: { meta: { title: 'Main title' } },
                },
                {
                  path: 'child1',
                  component: DummyComponent,
                },
              ]),
            ],
          });

          runInZone(() => getRouter().initialNavigation());

          const title = getTitleMock();
          title.getTitle.mockReturnValue('original title');

          getService()._setup();
          tick();

          expect(title.setTitle).toHaveBeenCalledWith('tpl_Main title');

          runInZone(() => getRouter().navigateByUrl('/child1'));
          tick();

          expect(title.setTitle).toHaveBeenCalledWith('tpl_original title');
        }));

        it('should set original title if route meta has no title', fakeAsync(() => {
          TestBed.configureTestingModule({
            providers: [
              provideRoutesWithMeta([
                {
                  path: '',
                  component: DummyComponent,
                  data: { meta: { title: 'Main title' } },
                },
                {
                  path: 'child1',
                  component: DummyComponent,
                  data: { meta: { notTitle: 'exists' } },
                },
              ]),
            ],
          });

          runInZone(() => getRouter().initialNavigation());

          const title = getTitleMock();
          title.getTitle.mockReturnValue('original title');

          getService()._setup();
          tick();

          expect(title.setTitle).toHaveBeenCalledWith('tpl_Main title');

          runInZone(() => getRouter().navigateByUrl('/child1'));
          tick();

          expect(title.setTitle).toHaveBeenCalledWith('tpl_original title');
        }));

        describe('with default title', () => {
          it('should set default title if route does not have meta', fakeAsync(() => {
            TestBed.configureTestingModule({
              providers: [
                provideRouteMetaConfig({
                  defaultMeta: { title: 'default title' },
                }),
                provideRoutesWithMeta([
                  {
                    path: '',
                    component: DummyComponent,
                    data: { meta: { title: 'Main title' } },
                  },
                  {
                    path: 'child1',
                    component: DummyComponent,
                  },
                ]),
              ],
            });

            runInZone(() => getRouter().initialNavigation());

            const title = getTitleMock();
            title.getTitle.mockReturnValue('original title');

            getService()._setup();
            tick();

            expect(title.setTitle).toHaveBeenCalledWith('tpl_Main title');

            runInZone(() => getRouter().navigateByUrl('/child1'));
            tick();

            expect(title.setTitle).toHaveBeenCalledWith('tpl_default title');
          }));

          it('should set default title if route meta has no title', fakeAsync(() => {
            TestBed.configureTestingModule({
              providers: [
                provideRouteMetaConfig({
                  defaultMeta: { title: 'default title' },
                }),
                provideRoutesWithMeta([
                  {
                    path: '',
                    component: DummyComponent,
                    data: { meta: { title: 'Main title' } },
                  },
                  {
                    path: 'child1',
                    component: DummyComponent,
                    data: { meta: { notTitle: 'exists' } },
                  },
                ]),
              ],
            });

            runInZone(() => getRouter().initialNavigation());

            const title = getTitleMock();
            title.getTitle.mockReturnValue('original title');

            getService()._setup();
            tick();

            expect(title.setTitle).toHaveBeenCalledWith('tpl_Main title');

            runInZone(() => getRouter().navigateByUrl('/child1'));
            tick();

            expect(title.setTitle).toHaveBeenCalledWith('tpl_default title');
          }));
        });
      });

      describe('other meta tags', () => {
        it('should update meta tags from route data using `RouterMetaContextService._templateStr()`', fakeAsync(() => {
          TestBed.configureTestingModule({
            providers: [
              provideRoutesWithMeta([
                {
                  path: '',
                  component: DummyComponent,
                  data: {
                    meta: { description: 'Description', 'custom:tag': 'value' },
                  },
                },
                {
                  path: 'child1',
                  component: DummyComponent,
                  data: {
                    meta: {
                      description: 'Child1 description',
                      'custom:tag': 'Child1 value',
                    },
                  },
                },
              ]),
            ],
          });

          runInZone(() => getRouter().initialNavigation());

          const meta = getMetaMock();

          getService()._setup();
          tick();

          expect(meta.updateTag).toHaveBeenCalledWith({
            name: 'description',
            content: 'tpl_Description',
          });
          expect(meta.updateTag).toHaveBeenCalledWith({
            name: 'custom:tag',
            content: 'tpl_value',
          });

          meta.updateTag.mockReset();
          runInZone(() => getRouter().navigateByUrl('/child1'));
          tick();

          expect(meta.updateTag).toHaveBeenCalledWith({
            name: 'description',
            content: 'tpl_Child1 description',
          });
          expect(meta.updateTag).toHaveBeenCalledWith({
            name: 'custom:tag',
            content: 'tpl_Child1 value',
          });
        }));

        it(
          'should call `RouterMetaContextService._templateStr()` with ' +
            '[meta.content, context, {templates, allMeta, name}]',
          fakeAsync(() => {
            TestBed.configureTestingModule({
              providers: [
                provideRoutesWithMeta([
                  {
                    path: '',
                    component: DummyComponent,
                    data: {
                      meta: {
                        description: 'desc',
                        otherMeta: 'other',
                        _templates_: { __customTpls: '' },
                      },
                    },
                  },
                ]),
              ],
            });

            runInZone(() => getRouter().initialNavigation());

            const customContext = { __customCtx: true };

            const ctxService = getRouterMetaContextServiceMock();
            ctxService.getContext.mockReturnValue(of(customContext));

            getService()._setup();
            tick();

            expect(ctxService._templateStr).toHaveBeenCalledWith(
              'desc',
              customContext,
              {
                name: 'description',
                templates: { __customTpls: '' },
                meta: { otherMeta: 'other', description: 'desc' },
              },
            );
            expect(ctxService._templateStr).toHaveBeenCalledWith(
              'other',
              customContext,
              {
                name: 'otherMeta',
                templates: { __customTpls: '' },
                meta: { otherMeta: 'other', description: 'desc' },
              },
            );
          }),
        );

        it('should pass full meta object to `Meta.updateTag()` with processed `content`', fakeAsync(() => {
          TestBed.configureTestingModule({
            providers: [
              provideRoutesWithMeta([
                {
                  path: '',
                  component: DummyComponent,
                  data: {
                    meta: {
                      description: {
                        name: 'description',
                        content: 'content',
                        id: 'id',
                      },
                    },
                  },
                },
              ]),
            ],
          });

          runInZone(() => getRouter().initialNavigation());

          const meta = getMetaMock();

          getService()._setup();
          tick();

          expect(meta.updateTag).toHaveBeenCalledWith({
            name: 'description',
            content: 'tpl_content', // <-- Processed via `RouterMetaContextService._templateStr()`
            id: 'id',
          });
        }));

        it('should replace previous meta tags with new', fakeAsync(() => {
          TestBed.configureTestingModule({
            providers: [
              provideRoutesWithMeta([
                {
                  path: '',
                  component: DummyComponent,
                  data: { meta: { description: 'desc' } },
                },
                {
                  path: 'child1',
                  component: DummyComponent,
                  data: { meta: { 'custom:tag': 'value' } },
                },
              ]),
            ],
          });

          runInZone(() => getRouter().initialNavigation());

          const meta = getMetaMock();

          getService()._setup();
          tick();

          expect(meta.updateTag).toHaveBeenCalledWith({
            name: 'description',
            content: 'tpl_desc',
          });

          meta.updateTag.mockReset();
          runInZone(() => getRouter().navigateByUrl('/child1'));
          tick();

          expect(meta.updateTag).toHaveBeenCalledWith({
            name: 'custom:tag',
            content: 'tpl_value',
          });
          expect(meta.removeTag).toHaveBeenCalledWith('name="description"');
        }));

        it('should remove previous meta tags if route does not have meta', fakeAsync(() => {
          TestBed.configureTestingModule({
            providers: [
              provideRoutesWithMeta([
                {
                  path: '',
                  component: DummyComponent,
                  data: { meta: { description: 'desc' } },
                },
                {
                  path: 'child1',
                  component: DummyComponent,
                },
              ]),
            ],
          });

          runInZone(() => getRouter().initialNavigation());

          const meta = getMetaMock();

          getService()._setup();
          tick();

          expect(meta.updateTag).toHaveBeenCalledWith({
            name: 'description',
            content: 'tpl_desc',
          });

          runInZone(() => getRouter().navigateByUrl('/child1'));
          tick();

          expect(meta.removeTag).toHaveBeenCalledWith('name="description"');
        }));

        it('should remove previous meta tags if route does not have meta tags', fakeAsync(() => {
          TestBed.configureTestingModule({
            providers: [
              provideRoutesWithMeta([
                {
                  path: '',
                  component: DummyComponent,
                  data: { meta: { description: 'desc' } },
                },
                {
                  path: 'child1',
                  component: DummyComponent,
                  data: { meta: {} },
                },
              ]),
            ],
          });

          runInZone(() => getRouter().initialNavigation());

          const meta = getMetaMock();

          getService()._setup();
          tick();

          expect(meta.updateTag).toHaveBeenCalledWith({
            name: 'description',
            content: 'tpl_desc',
          });

          runInZone(() => getRouter().navigateByUrl('/child1'));
          tick();

          expect(meta.removeTag).toHaveBeenCalledWith('name="description"');
        }));

        describe('with default tags', () => {
          it('should merge default tags with current tags', fakeAsync(() => {
            TestBed.configureTestingModule({
              providers: [
                provideRouteMetaConfig({
                  defaultMeta: { 'default:tag': 'set' },
                }),
                provideRoutesWithMeta([
                  {
                    path: '',
                    component: DummyComponent,
                    data: { meta: { description: 'desc' } },
                  },
                  {
                    path: 'child1',
                    component: DummyComponent,
                    data: { meta: { 'custom:tag': 'value' } },
                  },
                ]),
              ],
            });

            runInZone(() => getRouter().initialNavigation());

            const meta = getMetaMock();

            getService()._setup();
            tick();

            expect(meta.updateTag).toHaveBeenCalledWith({
              name: 'description',
              content: 'tpl_desc',
            });
            expect(meta.updateTag).toHaveBeenCalledWith({
              name: 'default:tag',
              content: 'tpl_set',
            });

            meta.updateTag.mockReset();
            runInZone(() => getRouter().navigateByUrl('/child1'));
            tick();

            expect(meta.updateTag).toHaveBeenCalledWith({
              name: 'custom:tag',
              content: 'tpl_value',
            });
            expect(meta.updateTag).toHaveBeenCalledWith({
              name: 'default:tag',
              content: 'tpl_set',
            });
            expect(meta.removeTag).toHaveBeenCalledWith('name="description"');
          }));

          it('should add default tags if route does not have meta', fakeAsync(() => {
            TestBed.configureTestingModule({
              providers: [
                provideRouteMetaConfig({
                  defaultMeta: { 'default:tag': 'set' },
                }),
                provideRoutesWithMeta([
                  {
                    path: '',
                    component: DummyComponent,
                    data: { meta: { description: 'desc' } },
                  },
                  {
                    path: 'child1',
                    component: DummyComponent,
                  },
                ]),
              ],
            });

            runInZone(() => getRouter().initialNavigation());

            const meta = getMetaMock();

            getService()._setup();
            tick();

            expect(meta.updateTag).toHaveBeenCalledWith({
              name: 'description',
              content: 'tpl_desc',
            });
            expect(meta.updateTag).toHaveBeenCalledWith({
              name: 'default:tag',
              content: 'tpl_set',
            });

            meta.updateTag.mockReset();
            runInZone(() => getRouter().navigateByUrl('/child1'));
            tick();

            expect(meta.updateTag).toHaveBeenCalledWith({
              name: 'default:tag',
              content: 'tpl_set',
            });
            expect(meta.removeTag).toHaveBeenCalledWith('name="description"');
          }));
        });
      });
    });
  });
});

function provideRoutesWithMeta(routes: RoutesWithMeta): Provider[] {
  return provideRoutes(routes);
}

function provideRouteMetaConfig(config: RouterMetaConfig): Provider {
  return {
    provide: ROUTE_META_CONFIG,
    useValue: config,
  };
}

function runInZone<F extends AnyFunction>(fn: F): ReturnType<F> {
  return getZone().run(fn);
}

function getService(): RouterMetaService {
  return TestBed.get(RouterMetaService);
}

function getTitleMock(): TitleMock {
  return TestBed.get(Title);
}

function getMetaMock(): MetaMock {
  return TestBed.get(Meta);
}

function getRouter(): Router {
  return TestBed.get(Router);
}

function getZone(): NgZone {
  return TestBed.get(NgZone);
}

function getRouterMetaContextServiceMock(): RouterMetaContextServiceMock {
  return TestBed.get(RouterMetaContextService);
}
