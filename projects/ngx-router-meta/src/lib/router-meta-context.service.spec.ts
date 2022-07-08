import { Component, NgZone } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NavigationExtras, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { from, map, Observable } from 'rxjs';

import { ROUTE_META_CONFIG } from './router-meta';
import { RouterMetaContextService } from './router-meta-context.service';

@Component({ selector: 'nrm-dummy', template: '' })
class DummyComponent {}

describe('Service: RouterMetaContext', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: '', component: DummyComponent },
          { path: 'path1', component: DummyComponent },
          { path: 'path2', component: DummyComponent },
        ]),
      ],
      declarations: [DummyComponent],
      providers: [
        RouterMetaContextService,
        { provide: ROUTE_META_CONFIG, useValue: {} },
      ],
    });
  });

  describe('getContext() method', () => {
    it('should return context observable', () => {
      const res$ = getService().getContext();

      expect(res$).toEqual(expect.any(Observable));
    });

    it('should emit on subscription', () => {
      const callback = jest.fn();

      getService().getContext().subscribe(callback);

      expect(callback).toHaveBeenCalledWith({});
    });

    it('should return processed context', () => {
      const callback = jest.fn();

      getService().getContext().subscribe(callback);

      getService().provideContext({ name: 'value' });

      expect(callback).toHaveBeenCalledWith({
        name: {
          replace: /\{name\}/g,
          value: 'value',
        },
      });
    });
  });

  describe('provideContext() method', () => {
    let processContext: jest.SpyInstance;

    beforeEach(() => {
      processContext = jest
        .spyOn(getService(), '_processContext')
        .mockImplementation((ctx) => ctx);
    });

    it('should use `this._processContext()` on context', () => {
      const callback = jest.fn();

      getService().getContext().subscribe(callback);

      processContext.mockReturnValue({ mocked: true });

      getService().provideContext({ ctx: true });

      expect(callback).toHaveBeenCalledWith({ mocked: true });
      expect(processContext).toHaveBeenCalledWith({ ctx: true });
    });

    it('should set context object', () => {
      const callback = jest.fn();

      getService().getContext().subscribe(callback);

      getService().provideContext({ ctx: true });

      expect(callback).toHaveBeenCalledWith({ ctx: true });
    });

    it('should merge context with previous', () => {
      const callback = jest.fn();

      getService().getContext().subscribe(callback);

      getService().provideContext({ ctx: true });
      getService().provideContext({ extra: true });

      expect(callback).toHaveBeenCalledWith({
        ctx: true,
        extra: true,
      });
    });

    it('should set context from observable', () => {
      const callback = jest.fn();

      getService().getContext().subscribe(callback);

      getService().provideContext(
        from([1, 2, 3]).pipe(map((n) => ({ [`key_${n}`]: n }))),
      );

      expect(callback).toHaveBeenCalledWith({
        key_1: 1,
        key_2: 2,
        key_3: 3,
      });
    });

    it('should clear context between router navigations', fakeAsync(() => {
      const callback = jest.fn();

      getService().getContext().subscribe(callback);

      getService().provideContext({ ctx: true });

      expect(callback).toHaveBeenCalledWith({ ctx: true });

      callback.mockReset();
      navigateTo('/path1');
      tick();

      expect(callback).toHaveBeenCalledWith({});
    }));
  });

  describe('provideDefaultContext() method', () => {
    let processContext: jest.SpyInstance;

    beforeEach(() => {
      processContext = jest
        .spyOn(getService(), '_processContext')
        .mockImplementation((ctx) => ctx);
    });

    it('should use `this._processContext()` on context', () => {
      const callback = jest.fn();

      getService().getContext().subscribe(callback);

      processContext.mockReturnValue({ mocked: true });

      getService().provideDefaultContext({ default: true });

      expect(callback).toHaveBeenCalledWith({ mocked: true });
      expect(processContext).toHaveBeenCalledWith({ default: true });
    });

    it('should set context object', () => {
      const callback = jest.fn();

      getService().getContext().subscribe(callback);

      getService().provideDefaultContext({ default: true });

      expect(callback).toHaveBeenCalledWith({ default: true });
    });

    it('should merge context with previous', () => {
      const callback = jest.fn();

      getService().getContext().subscribe(callback);

      getService().provideDefaultContext({ default: true });
      getService().provideDefaultContext({ extra: true });

      expect(callback).toHaveBeenCalledWith({
        default: true,
        extra: true,
      });
    });

    it('should set context from observable', () => {
      const callback = jest.fn();

      getService().getContext().subscribe(callback);

      getService().provideDefaultContext(
        from([1, 2, 3]).pipe(map((n) => ({ [`key_${n}`]: n }))),
      );

      expect(callback).toHaveBeenCalledWith({
        key_1: 1,
        key_2: 2,
        key_3: 3,
      });
    });

    it('should persist context between router navigations', fakeAsync(() => {
      const callback = jest.fn();

      getService().getContext().subscribe(callback);

      getService().provideDefaultContext({ default: true });

      expect(callback).toHaveBeenCalledWith({ default: true });

      callback.mockReset();
      navigateTo('/path1');
      tick();

      expect(callback).toHaveBeenCalledWith({ default: true });
    }));
  });

  describe('clearContext() method', () => {
    beforeEach(() => {
      jest
        .spyOn(getService(), '_processContext')
        .mockImplementation((ctx) => ctx);
    });

    it('should clear context but keep default context', () => {
      const callback = jest.fn();

      getService().getContext().subscribe(callback);

      getService().provideDefaultContext({ default: true });
      getService().provideContext({ normal: true });

      expect(callback).toHaveBeenCalledWith({
        default: true,
        normal: true,
      });

      getService().clearContext();

      expect(callback).toHaveBeenCalledWith({
        default: true,
      });
    });
  });

  describe('clearContext() method', () => {
    beforeEach(() => {
      jest
        .spyOn(getService(), '_processContext')
        .mockImplementation((ctx) => ctx);
    });

    it('should default context but keep normal context', () => {
      const callback = jest.fn();

      getService().getContext().subscribe(callback);

      getService().provideDefaultContext({ default: true });
      getService().provideContext({ normal: true });

      expect(callback).toHaveBeenCalledWith({
        default: true,
        normal: true,
      });

      getService().clearDefaultContext();

      expect(callback).toHaveBeenCalledWith({
        normal: true,
      });
    });
  });

  describe('_processContext() method', () => {
    it('should return context with computed RegExp for replacing', () => {
      const res = getService()._processContext({
        prop1: 'val1',
        prop2: 'val2',
      });

      expect(res).toEqual({
        prop1: { replace: /\{prop1\}/g, value: 'val1' },
        prop2: { replace: /\{prop2\}/g, value: 'val2' },
      });
    });

    it('should cache computed RegExp for same property names', () => {
      const res1 = getService()._processContext({ prop1: 'val1' });
      const res2 = getService()._processContext({ prop1: 'val2' });

      expect(res1.prop1.replace).toBe(res2.prop1.replace);
    });
  });

  describe('_templateStr() method', () => {
    it('should return string with replaced data from `data`', () => {
      const data = getService()._processContext({ p1: 'v1', p2: 'v2' });

      const res = getService()._templateStr('P1: {p1}, P2: {p2}', data);

      expect(res).toBe('P1: v1, P2: v2');
    });

    it('should return empty string when no `str` or `data` given', () => {
      expect(getService()._templateStr()).toBe('');
      expect(getService()._templateStr('')).toBe('');
    });

    it('should allow custom interpolations in templates', () => {
      TestBed.configureTestingModule({
        providers: [
          {
            provide: ROUTE_META_CONFIG,
            useValue: {
              interpolation: { start: '<', end: '>' },
            },
          },
        ],
      });

      const data = getService()._processContext({ p1: 'v1', p2: 'v2' });

      const res = getService()._templateStr('P1: <p1>, P2: <p2>', data);

      expect(res).toBe('P1: v1, P2: v2');
    });

    it('should use `extras.meta` as extra context', () => {
      const data = getService()._processContext({ p1: 'v1' });
      const meta = getService()._processContext({ p2: 'v2' });

      const res = getService()._templateStr('P1: {p1}, P2: {p2}', data, {
        meta,
      });

      expect(res).toBe('P1: v1, P2: v2');
    });

    describe('extras.templates object', () => {
      it('should render based on provided template by `extras.name`', () => {
        const data = getService()._processContext({ p1: 'v1' });
        const templates = { name: 'TPL - P1: {p1}' };

        const res = getService()._templateStr('P1: {p1}', data, {
          templates,
          name: 'name',
        });

        expect(res).toBe('TPL - P1: v1');
      });

      it('should NOT use template without `extras.name`', () => {
        const data = getService()._processContext({ p1: 'v1' });
        const templates = { name: 'TPL - P1: {p1}' };

        const res = getService()._templateStr('P1: {p1}', data, {
          templates,
        });

        expect(res).toBe('P1: v1');
      });

      it('should allow to render original value as `extras.name`', () => {
        const data = getService()._processContext({ p1: 'v1' });
        const templates = { name: 'TPL - [{name}]' };

        const res = getService()._templateStr('P1: {p1}', data, {
          templates,
          name: 'name',
        });

        expect(res).toBe('TPL - [P1: v1]');
      });
    });
  });
});

function getService(): RouterMetaContextService {
  return TestBed.get(RouterMetaContextService);
}

function navigateTo(url: string, extras?: NavigationExtras) {
  const zone = TestBed.get(NgZone) as NgZone;
  const router = TestBed.get(Router) as Router;
  return zone.run(() => router.navigateByUrl(url, extras));
}
