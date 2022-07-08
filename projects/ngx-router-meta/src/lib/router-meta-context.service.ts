import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  combineLatest,
  filter,
  isObservable,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  startWith,
  Subject,
} from 'rxjs';

import {
  MetaContext,
  RouteMetaTemplates,
  RouterMetaConfig,
  RouterMetaInterpolation,
  ROUTE_META_CONFIG,
  unfoldContext,
} from './router-meta';
import { Indexable } from './types';
import { escapeRegExp, isNavigationEndEvent } from './util';

/** @internal */
export interface MetaInfo {
  replace: RegExp;
  value: any;
}

/** @internal */
export interface ProcessedMetaContext extends Indexable<MetaInfo> {}

/**
 * Service to provide context for meta tags
 */
@Injectable({
  providedIn: 'root',
})
export class RouterMetaContextService {
  private static interpolation: RouterMetaInterpolation = {
    start: '{',
    end: '}',
  };

  private ctxNameCache: Indexable<RegExp> = {};

  private interpolation =
    this.config.interpolation || RouterMetaContextService.interpolation;
  private interpolationStart = escapeRegExp(this.interpolation.start);
  private interpolationEnd = escapeRegExp(this.interpolation.end);

  private navigationEnd$ = this.router.events.pipe(
    filter(isNavigationEndEvent),
  );

  private metaDefaultContext$$ = new Subject<Observable<MetaContext>>();
  private metaContext$$ = new Subject<Observable<MetaContext>>();
  private clearDefaultContext$ = new Subject<void>();
  private clearContext$ = new Subject<void>();

  private metaDefaultContext$: Observable<ProcessedMetaContext> =
    this.clearDefaultContext$.pipe(
      startWith(null),
      unfoldContext(this.metaDefaultContext$$, (ctx) =>
        this._processContext(ctx),
      ),
    );

  private metaContext$: Observable<ProcessedMetaContext> = merge(
    this.clearContext$,
    this.navigationEnd$, // Start fresh after every navigation
  ).pipe(
    startWith(null),
    unfoldContext(this.metaContext$$, (ctx) => this._processContext(ctx)),
  );

  private context$ = combineLatest(
    this.metaDefaultContext$,
    this.metaContext$,
  ).pipe(
    map(([defaultCtx, ctx]) => ({ ...defaultCtx, ...ctx })),
    shareReplay(),
  );

  constructor(
    @Inject(ROUTE_META_CONFIG) private config: RouterMetaConfig,
    private router: Router,
  ) {}

  /**
   * Provided context will be available between router navigations
   *
   * Multiple contexts will be merged together
   */
  provideDefaultContext(ctx: MetaContext | Observable<MetaContext>) {
    this.metaDefaultContext$$.next(isObservable(ctx) ? ctx : of(ctx));
  }

  /**
   * Provided context will be available ONLY until next router navigation
   *
   * Multiple contexts will be merged together
   *
   * If you want to persist context between navigations -
   * use {@link RouterMetaContextService#provideDefaultContext()}
   */
  provideContext(ctx: MetaContext | Observable<MetaContext>) {
    this.metaContext$$.next(isObservable(ctx) ? ctx : of(ctx));
  }

  /**
   * Clear default context provided by
   * {@link RouterMetaContextService#provideDefaultContext()}
   */
  clearDefaultContext() {
    this.clearDefaultContext$.next();
  }

  /**
   * Clear context provided by
   * {@link RouterMetaContextService#provideContext()}
   */
  clearContext() {
    this.clearContext$.next();
  }

  /**
   * Observable of computed context for meta tags
   */
  getContext() {
    return this.context$;
  }

  /** @internal */
  _templateStr(
    str?: string,
    data?: ProcessedMetaContext,
    extras?: {
      name?: string;
      templates?: RouteMetaTemplates;
      meta?: ProcessedMetaContext;
    },
  ) {
    if (!str || !data) {
      return str || '';
    }

    let template = str;
    let ctx = data;

    if (extras) {
      template =
        extras.templates && extras.name
          ? extras.templates[extras.name] || template
          : template;
      ctx = { ...this.prepareContext(extras.meta, ctx), ...ctx };

      // Recover lost `str` value under provided `extras.name` key in context
      if (extras.name && extras.name in ctx === false) {
        const nameCtx = this._processContext({ [extras.name]: str });
        ctx = { ...ctx, ...this.prepareContext(nameCtx, ctx) };
      }
    }

    return this.templateReplace(template, ctx);
  }

  /** @internal */
  _processContext(ctx: MetaContext): ProcessedMetaContext {
    return Object.keys(ctx).reduce(
      (acc, key) => ({
        ...acc,
        [key]: {
          replace: this.getContextReplace(key),
          value: ctx[key],
        },
      }),
      {} as ProcessedMetaContext,
    );
  }

  private prepareContext(
    ctx?: ProcessedMetaContext,
    data?: ProcessedMetaContext,
  ): ProcessedMetaContext | undefined {
    if (!ctx || !data) {
      return ctx;
    }

    return Object.keys(ctx).reduce((c, key) => {
      c[key] = {
        ...ctx[key],
        value: this.templateReplace(ctx[key].value, data),
      };
      return c;
    }, {} as ProcessedMetaContext);
  }

  private templateReplace(tpl: string, ctx: ProcessedMetaContext) {
    return Object.keys(ctx).reduce(
      (s, key) => s.replace(ctx[key].replace, ctx[key].value),
      tpl,
    );
  }

  private getContextReplace(name: string) {
    return name in this.ctxNameCache
      ? this.ctxNameCache[name]
      : (this.ctxNameCache[name] = new RegExp(
          `${this.interpolationStart}${escapeRegExp(name)}${
            this.interpolationEnd
          }`,
          'g',
        ));
  }
}
