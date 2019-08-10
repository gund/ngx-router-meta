import { MetaDefinition } from '@angular/platform-browser';
import { Data, Route, Routes } from '@angular/router';
import { EMPTY, Observable, OperatorFunction } from 'rxjs';
import {
  catchError,
  map,
  scan,
  startWith,
  switchAll,
  switchMap,
} from 'rxjs/operators';

import { Indexable, InferArray, UnionToIntersection } from './types';

export interface RouterMetaInterpolation {
  start: string;
  end: string;
}

export interface RouterMetaConfig {
  defaultMeta?: RouteMeta;
  interpolation?: RouterMetaInterpolation;
}

export interface MetaContext extends Indexable<any> {}

export interface RouteMetaTemplates extends Indexable<string> {}

export interface RouteMeta
  extends Indexable<string | MetaDefinition | undefined> {
  _templates_?: RouteMetaTemplates;
  title?: string;
  description?: string;
}

export interface DataWithMeta extends Data {
  meta?: RouteMeta;
}

export interface RouteWithMeta extends Route {
  data?: DataWithMeta;
}

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
      switchMap(() => ctx$$.pipe(switchAll()).pipe(catchError(() => EMPTY))),
      map(ctx => mapFn(ctx)),
      scan((acc, ctx) => ({ ...acc, ...ctx })), // Merge contexts
      startWith({} as R),
    );
}
