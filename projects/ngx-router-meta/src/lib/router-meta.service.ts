import { isPlatformServer } from '@angular/common';
import {
  Inject,
  Injectable,
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
  filter,
  map,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';

import {
  isDataWithMeta,
  MetaContext,
  RouteMeta,
  RouteMetaTemplates,
  RouterMetaConfig,
  ROUTE_META_CONFIG,
} from './router-meta';
import {
  ProcessedMetaContext,
  RouterMetaContextService,
} from './router-meta-context.service';
import { Indexable } from './types';
import { isNavigationEndEvent } from './util';

const TITLE_STATE = makeStateKey<string>('RouterMetaTitle');

/**
 * Service responsible for updating meta tags based on router configuration
 *
 * To provide context - use {@link RouterMetaContextService}
 */
@Injectable({ providedIn: 'root' })
export class RouterMetaService implements OnDestroy {
  private initialized = false;
  private metaTags: Indexable<boolean> = {};

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
    map((route) => this.getLastRoute(route)),
    filter((route) => route.outlet === 'primary'),
    switchMap((route) => route.data),
  );

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    @Inject(ROUTE_META_CONFIG) private config: RouterMetaConfig,
    private router: Router,
    private title: Title,
    private meta: Meta,
    private contextService: RouterMetaContextService,
    @Optional() private transferState?: TransferState,
  ) {}

  /**
   * Returns original title of index page.
   *
   * If SSR was used with {@link StateTransfer} -
   * then original title will be preserved between server and client states
   */
  getOriginalTitle() {
    return this.originalTitle;
  }

  /** @internal */
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

    combineLatest(this.routeData$, this.contextService.getContext())
      .pipe(takeUntil(this.destroyed$))
      .subscribe(([data, ctx]) => this.updateAllMeta(data, ctx));
  }

  private updateAllMeta(data: Data, ctx: ProcessedMetaContext = {}) {
    const { _templates_: defaultTemplates, ...defaultAllMeta } =
      this.defaultMeta;

    if (!isDataWithMeta(data)) {
      this.resetAllMeta(ctx, defaultAllMeta);
      return;
    }

    const { meta } = data;
    const { _templates_, ...allMeta } = meta;
    const { title, ...otherMeta } = allMeta;
    const { title: _, ...defaultOtherMeta } = defaultAllMeta;

    const allMetaDefaulted = { ...defaultAllMeta, ...allMeta };
    const otherMetaDefaulted = { ...defaultOtherMeta, ...otherMeta };
    const templates = {
      ...defaultTemplates,
      ..._templates_,
    } as RouteMetaTemplates;

    const processedMeta = this.contextService._processContext(allMetaDefaulted);

    this.updateTitle(title, ctx, templates, processedMeta);

    Object.keys(otherMetaDefaulted).forEach((name) =>
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
      .filter((name) => name in otherMetaDefaulted === false)
      .forEach((name) => this.resetMeta(name, ctx, templates, processedMeta));
  }

  private resetAllMeta(ctx: ProcessedMetaContext, defaultMeta: RouteMeta) {
    const { title, ...defaultOtherMeta } = defaultMeta;
    const metaDefaulted = { ...defaultOtherMeta, ...this.metaTags };
    const meta = this.contextService._processContext(defaultMeta);

    this.resetTitle(ctx, this.defaultMeta._templates_, meta);

    Object.keys(metaDefaulted).forEach((name) =>
      this.resetMeta(name, ctx, this.defaultMeta._templates_, meta),
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
        this.contextService._templateStr(title, ctx, {
          name: 'title',
          templates,
          meta,
        }),
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
      this.contextService._templateStr(
        this.defaultMeta.title || this.originalTitle,
        ctx,
        {
          name: 'title',
          meta,
          templates,
        },
      ),
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

      metaDef.content = this.contextService._templateStr(metaDef.content, ctx, {
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

  private getLastRoute(route: ActivatedRoute) {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }
}
