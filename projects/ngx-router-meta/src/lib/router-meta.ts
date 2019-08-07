import { MetaDefinition } from '@angular/platform-browser';
import { Data, Route, Routes } from '@angular/router';

import { Indexable, InferArray, UnionToIntersection } from './types';

export interface RouterMetaConfig {
  defaultMeta?: RouteMeta;
}

export interface MetaContext extends Indexable<any> {}

export interface RouteMeta
  extends Indexable<string | MetaDefinition | undefined> {
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
