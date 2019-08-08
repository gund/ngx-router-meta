import { Inject, Injectable, InjectionToken } from '@angular/core';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';
import { ActivatedRoute, Data, NavigationEnd, Router } from '@angular/router';
import { isObservable, merge, Observable, of, Subject } from 'rxjs';
import {
  filter,
  map,
  mapTo,
  scan,
  startWith,
  switchAll,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';

import { isDataWithMeta, MetaContext, RouterMetaConfig } from './router-meta';
import { Indexable } from './types';

export const ROUTE_META_CONFIG = new InjectionToken<RouterMetaConfig>(
  'ROUTE_META_CONFIG',
);

const RESET_CONTEXT = { __resetContext: true };

@Injectable({ providedIn: 'root' })
export class RouterMetaService {
  private initialized = false;
  private metaTags: Indexable<boolean> = {};

  private defaultMeta = this.config.defaultMeta;
  private originalTitle = this.title.getTitle();

  private navigationEnd$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
  );

  private metaContext$$ = new Subject<Observable<MetaContext>>();
  private metaContext$: Observable<MetaContext> = merge(
    this.metaContext$$.pipe(switchAll()),
    this.navigationEnd$.pipe(mapTo(RESET_CONTEXT)), // Reset context after every navigation
  ).pipe(
    scan((acc, ctx) => (ctx === RESET_CONTEXT ? {} : { ...acc, ...ctx })), // Merge contexts
    startWith({}),
  );

  constructor(
    @Inject(ROUTE_META_CONFIG) private config: RouterMetaConfig,
    private router: Router,
    private title: Title,
    private meta: Meta,
  ) {}

  provideContext(ctx: MetaContext | Observable<MetaContext>) {
    this.metaContext$$.next(isObservable(ctx) ? ctx : of(ctx));
  }

  /** @internal */
  _setup() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    this.navigationEnd$
      .pipe(
        map(() => this.router.routerState.root),
        map(route => this.getLastRoute(route)),
        filter(route => route.outlet === 'primary'),
        switchMap(route => route.data),
        withLatestFrom(this.metaContext$),
      )
      .subscribe(([data, ctx]) => this.updateAllMeta(data, ctx));
  }

  private updateAllMeta(data: Data, ctx: MetaContext = {}) {
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

  private resetAllMeta(ctx: MetaContext) {
    this.resetTitle(ctx);
    Object.keys(this.metaTags).forEach(name => this.resetMeta(name, ctx));
  }

  private updateTitle(title?: string, ctx?: MetaContext) {
    if (title) {
      this.title.setTitle(this.templateStr(title, ctx));
    } else {
      this.resetTitle(ctx);
    }
  }

  private resetTitle(ctx?: MetaContext) {
    this.title.setTitle(
      (this.defaultMeta && this.defaultMeta.title) || this.originalTitle,
    );
  }

  private updateMeta(
    name: string,
    content?: string | MetaDefinition,
    ctx?: MetaContext,
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
    const defaultMeta = this.defaultMeta && this.defaultMeta[name];

    if (defaultMeta) {
      this.updateMeta(name, defaultMeta, ctx);
    } else {
      this.meta.removeTag(`name="${name}"`);
      delete this.metaTags[name];
    }
  }

  private templateStr(str?: string, data?: MetaContext) {
    if (!str || !data) {
      return '';
    }

    return Object.keys(data).reduce(
      (s, key) => s.replace(`{${key}}`, data[key]),
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
