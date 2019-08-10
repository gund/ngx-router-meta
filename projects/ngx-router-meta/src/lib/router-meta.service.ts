import { isPlatformServer } from '@angular/common';
import {
  Inject,
  Injectable,
  InjectionToken,
  OnDestroy,
  Optional,
  PLATFORM_ID,
} from '@angular/core';
import {
  makeStateKey,
  Meta,
  MetaDefinition,
  Title,
  TransferState,
} from '@angular/platform-browser';
import { ActivatedRoute, Data, Router } from '@angular/router';
import {
  combineLatest,
  EMPTY,
  isObservable,
  Observable,
  of,
  Subject,
} from 'rxjs';
import {
  catchError,
  filter,
  map,
  scan,
  startWith,
  switchAll,
  switchMap,
  takeUntil,
} from 'rxjs/operators';

import {
  isDataWithMeta,
  MetaContext,
  RouteMeta,
  RouteMetaTemplates,
  RouterMetaConfig,
  RouterMetaInterpolation,
} from './router-meta';
import { Indexable } from './types';
import { escapeRegExp, isNavigationEndEvent } from './util';

interface MetaInfo {
  replace: RegExp;
  value: any;
}

interface ProcessedMetaContext extends Indexable<MetaInfo> {}

export const ROUTE_META_CONFIG = new InjectionToken<RouterMetaConfig>(
  'ROUTE_META_CONFIG',
);

const TITLE_STATE = makeStateKey<string>('RouterMetaTitle');

@Injectable({ providedIn: 'root' })
export class RouterMetaService implements OnDestroy {
  private static interpolation: RouterMetaInterpolation = {
    start: '{',
    end: '}',
  };

  private initialized = false;
  private metaTags: Indexable<boolean> = {};
  private ctxNameCache: Indexable<RegExp> = {};

  private interpolation =
    this.config.interpolation || RouterMetaService.interpolation;
  private interpolationStart = escapeRegExp(this.interpolation.start);
  private interpolationEnd = escapeRegExp(this.interpolation.end);

  private defaultMeta = this.config.defaultMeta || {};

  private originalTitle = this.transferState
    ? this.transferState.get(TITLE_STATE, this.title.getTitle())
    : this.title.getTitle();

  private destroyed$ = new Subject<void>();

  private navigationEnd$ = this.router.events.pipe(
    filter(isNavigationEndEvent),
  );

  private routeData$ = this.navigationEnd$.pipe(
    map(() => this.router.routerState.root),
    map(route => this.getLastRoute(route)),
    filter(route => route.outlet === 'primary'),
    switchMap(route => route.data),
  );

  private metaContext$$ = new Subject<Observable<MetaContext>>();
  private metaContext$: Observable<ProcessedMetaContext> = this.navigationEnd$ // Start fresh after every navigation
    .pipe(
      switchMap(() =>
        this.metaContext$$.pipe(switchAll()).pipe(catchError(() => EMPTY)),
      ),
      map(ctx => this.processContext(ctx)),
      scan((acc, ctx) => ({ ...acc, ...ctx })), // Merge contexts
      startWith({}),
    );

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(ROUTE_META_CONFIG) private config: RouterMetaConfig,
    private router: Router,
    private title: Title,
    private meta: Meta,
    @Optional() private transferState: TransferState | undefined,
  ) {}

  provideContext(ctx: MetaContext | Observable<MetaContext>) {
    this.metaContext$$.next(isObservable(ctx) ? ctx : of(ctx));
  }

  getOriginalTitle() {
    return this.originalTitle;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
  }

  /** @internal */
  _setup() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    if (this.transferState && isPlatformServer(this.platformId)) {
      this.transferState.set(TITLE_STATE, this.originalTitle);
    }

    combineLatest(this.routeData$, this.metaContext$)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(([data, ctx]) => this.updateAllMeta(data, ctx));
  }

  private updateAllMeta(data: Data, ctx: ProcessedMetaContext = {}) {
    const {
      _templates_: defaultTemplates,
      ...defaultAllMeta
    } = this.defaultMeta;
    const { title: _, ...defaultOtherMeta } = defaultAllMeta;

    if (!isDataWithMeta(data)) {
      this.resetAllMeta(ctx, defaultOtherMeta);
      return;
    }

    const { meta } = data;
    const { _templates_, ...allMeta } = meta;
    const { title, ...otherMeta } = allMeta;

    const allMetaDefaulted = { ...defaultAllMeta, ...allMeta };
    const otherMetaDefaulted = { ...defaultOtherMeta, ...otherMeta };
    const templates = {
      ...defaultTemplates,
      ..._templates_,
    } as RouteMetaTemplates;

    const processedMeta = this.processContext(allMetaDefaulted);

    this.updateTitle(title, ctx, templates, processedMeta);

    Object.keys(otherMetaDefaulted).forEach(name =>
      this.updateMeta(
        name,
        otherMetaDefaulted[name],
        ctx,
        templates,
        processedMeta,
      ),
    );

    // Cleanup leftover meta tags
    Object.keys(this.metaTags)
      .filter(name => name in otherMetaDefaulted === false)
      .forEach(name => this.resetMeta(name, ctx, templates, processedMeta));
  }

  private resetAllMeta(ctx: ProcessedMetaContext, defaultMeta?: RouteMeta) {
    this.resetTitle(ctx, this.defaultMeta._templates_);

    const metaDefaulted = { ...defaultMeta, ...this.metaTags };

    Object.keys(metaDefaulted).forEach(name =>
      this.resetMeta(name, ctx, this.defaultMeta._templates_),
    );
  }

  private updateTitle(
    title?: string,
    ctx?: ProcessedMetaContext,
    templates?: RouteMetaTemplates,
    meta?: ProcessedMetaContext,
  ) {
    if (title) {
      this.title.setTitle(
        this.templateStr(title, ctx, { name: 'title', templates, meta }),
      );
    } else {
      this.resetTitle(ctx, templates, meta);
    }
  }

  private resetTitle(
    ctx?: ProcessedMetaContext,
    templates?: RouteMetaTemplates,
    meta?: ProcessedMetaContext,
  ) {
    this.title.setTitle(
      this.templateStr(this.defaultMeta.title || this.originalTitle, ctx, {
        name: 'title',
        meta,
        templates,
      }),
    );
  }

  private updateMeta(
    name: string,
    content?: string | MetaDefinition,
    ctx?: ProcessedMetaContext,
    templates?: RouteMetaTemplates,
    meta?: ProcessedMetaContext,
  ) {
    if (content) {
      const metaDef: MetaDefinition =
        typeof content === 'string' ? { name, content } : content;

      metaDef.content = this.templateStr(metaDef.content, ctx, {
        name,
        meta,
        templates,
      });

      this.meta.updateTag(metaDef);
      this.metaTags[name] = true;
    } else {
      this.resetMeta(name, ctx, templates, meta);
    }
  }

  private resetMeta(
    name: string,
    ctx?: MetaContext,
    templates?: RouteMetaTemplates,
    meta?: ProcessedMetaContext,
  ) {
    const defaultMeta = this.defaultMeta[name];

    if (defaultMeta) {
      this.updateMeta(name, defaultMeta, ctx, templates, meta);
    } else {
      this.meta.removeTag(`name="${name}"`);
      delete this.metaTags[name];
    }
  }

  private processContext(ctx: MetaContext): ProcessedMetaContext {
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

  private templateStr(
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
      ctx = { ...extras.meta, ...ctx };

      // Recover lost `str` value under provided `extras.name` key in context
      if (extras.name && extras.name in ctx === false) {
        ctx = { ...ctx, ...this.processContext({ [extras.name]: str }) };
      }
    }

    return Object.keys(ctx).reduce(
      (s, key) => s.replace(ctx[key].replace, ctx[key].value),
      template,
    );
  }

  private getLastRoute(route: ActivatedRoute) {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }
}
