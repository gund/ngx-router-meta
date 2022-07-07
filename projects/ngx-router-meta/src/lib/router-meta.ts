import { InjectionToken } from '@angular/core';
import { MetaDefinition } from '@angular/platform-browser';
import { Data, Route, Routes } from '@angular/router';
import {
  catchError,
  EMPTY,
  map,
  Observable,
  OperatorFunction,
  scan,
  startWith,
  switchAll,
  switchMapTo,
} from 'rxjs';

import { Indexable, InferArray, UnionToIntersection } from './types';

/**
 * Specifies identifiers of interpolations in meta strings
 */
export interface RouterMetaInterpolation {
  start: string;
  end: string;
}

/**
 * Configuration of {@link RouterMetaModule}
 */
export interface RouterMetaConfig {
  defaultMeta?: RouteMeta;
  interpolation?: RouterMetaInterpolation;
}

/**
 * Context for rendering meta tags
 */
export interface MetaContext extends Indexable<any> {}

/**
 * Template strings for rendering meta tags
 *
 * Every key must match a tag name it's applied to
 */
export interface RouteMetaTemplates extends Indexable<string> {}

/**
 * Meta tags of the {@link Route} with templates
 */
export interface RouteMeta
  extends Indexable<string | MetaDefinition | undefined> {
  _templates_?: RouteMetaTemplates;
  title?: string;
  description?: string | MetaDefinition;
}

/**
 * Describes {@link Route#data} with {@link RouteMeta}
 */
export interface DataWithMeta extends Data {
  meta?: RouteMeta;
}

/**
 * Describes {@link Route} with {@link DataWithMeta}
 */
export interface RouteWithMeta extends Route {
  data?: DataWithMeta;
}

/**
 * Describes {@link Routes} as array of {@link RouteWithMeta}
 */
export type RoutesWithMeta = RouteWithMeta[];

/**
 * Useful helper to combine different route definitions into single one
 *
 * For example, you want to use {@link RoutesWithMeta} and some other {@link RoutesWithSomething}
 * then you can combine them like so:
 * ```ts
 * const routes: MergeRoutes<RoutesWithMeta | RoutesWithSomething>;
 * // routes[].data will be union of {meta:...} and {something:...}
 * ```
 */
export type MergeRoutes<T extends Routes> = UnionToIntersection<
  InferArray<T>
>[];

/** @internal */
export const ROUTE_META_CONFIG = new InjectionToken<RouterMetaConfig>(
  'ROUTE_META_CONFIG',
);

/**
 * Check if {@link Route#data} contains {@link RouteMeta} object
 */
export function isDataWithMeta(data: Data): data is Required<DataWithMeta> {
  return !!data.meta;
}

/**
 * Allows to accumulate many context objects streams into one stream
 * while merging all context objects together
 * and running any transformation function
 */
export function unfoldContext<R>(
  ctx$$: Observable<Observable<MetaContext>>,
  mapFn: (ctx: MetaContext) => R,
): OperatorFunction<any, R> {
  return o$ =>
    o$.pipe(
      switchMapTo(
        ctx$$.pipe(
          switchAll(),
          catchError(() => EMPTY),
          map(ctx => mapFn(ctx)),
          scan((acc, ctx) => ({ ...acc, ...ctx })), // Merge contexts
          startWith({} as R),
        ),
      ),
    );
}
