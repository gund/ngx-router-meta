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
    if (!isDataWithMeta(data)) {
      this.resetAllMeta(ctx);
      return;
    }

    const { meta } = data;
    const { title, ...otherMeta } = meta;

    this.updateTitle(title, ctx);

    Object.keys(otherMeta).forEach(name =>
      this.updateMeta(name, otherMeta[name], ctx),
    );

    // Cleanup leftover meta tags
    Object.keys(this.metaTags)
      .filter(name => name in otherMeta === false)
      .forEach(name => this.resetMeta(name, ctx));
  }

  private resetAllMeta(ctx: ProcessedMetaContext) {
    this.resetTitle(ctx);
    Object.keys(this.metaTags).forEach(name => this.resetMeta(name, ctx));
  }

  private updateTitle(title?: string, ctx?: ProcessedMetaContext) {
    if (title) {
      this.title.setTitle(this.templateStr(title, ctx));
    } else {
      this.resetTitle(ctx);
    }
  }

  private resetTitle(ctx?: ProcessedMetaContext) {
    this.title.setTitle(
      this.templateStr(this.defaultMeta.title || this.originalTitle, ctx),
    );
  }

  private updateMeta(
    name: string,
    content?: string | MetaDefinition,
    ctx?: ProcessedMetaContext,
  ) {
    if (content) {
      const meta: MetaDefinition =
        typeof content === 'string' ? { name, content } : content;

      meta.content = this.templateStr(meta.content, ctx);

      this.meta.updateTag(meta);
      this.metaTags[name] = true;
    } else {
      this.resetMeta(name, ctx);
    }
  }

  private resetMeta(name: string, ctx?: MetaContext) {
    const defaultMeta = this.defaultMeta[name];

    if (defaultMeta) {
      this.updateMeta(name, defaultMeta, ctx);
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

  private templateStr(str?: string, data?: ProcessedMetaContext) {
    if (!str || !data) {
      return str || '';
    }

    return Object.keys(data).reduce(
      (s, key) => s.replace(data[key].replace, data[key].value),
      str,
    );
  }

  private getLastRoute(route: ActivatedRoute) {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }
}
