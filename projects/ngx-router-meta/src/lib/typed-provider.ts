import { FactoryProvider, InjectionToken, Provider, Type } from '@angular/core';

import { InferArray } from './types';

export type TypedFunction<R, A extends any[]> = (...args: A) => R;

export type AnyFunction = TypedFunction<any, any>;

export type AnyProviderToken<T> = AbstractType<T> | Type<T> | InjectionToken<T>;

export interface AbstractType<T> {
  prototype: T;
}

export type InferProvider<P> = P extends InjectionToken<infer T>
  ? T // tslint:disable-next-line: no-shadowed-variable
  : P extends Type<infer T>
  ? T // tslint:disable-next-line: no-shadowed-variable
  : P extends AbstractType<infer T>
  ? T
  : unknown;

export type TypedProviderI<P extends AnyProviderToken<any>, A> = A extends {
  useFactory: infer F;
  deps: any[];
}
  ? F extends TypedFunction<InferProvider<P>, any>
    ? TypedFactoryDepsProvider<P, InferProvider<P>, F>
    : TypedProvider<P>
  : A extends {
      // tslint:disable-next-line: no-shadowed-variable
      useFactory: infer F;
      deps: any[];
      multi: boolean;
    }
  ? F extends TypedFunction<InferProvider<P>, any>
    ? TypedFactoryDepsMultiProvider<P, InferProvider<P>, F>
    : TypedProvider<P>
  : TypedProvider<P>;

export type TypedProvider<
  P extends AnyProviderToken<any>,
  T = InferProvider<P>
> =
  | TypedTypeProvider<T>
  | TypedValueProvider<P, T>
  | TypedValueMultiProvider<P, T>
  | TypedClassProvider<P, T>
  | TypedClassMultiProvider<P, T>
  | TypedConstructorProvider<P, T>
  | TypedExistingProvider<P, T>
  | TypedExistingMultiProvider<P, T>
  | TypedFactoryProvider<P, T>
  | TypedFactoryMultiProvider<P, T>
  | any[];

export interface BaseProvider<P> {
  provide: P;
}

export interface BaseMultiProvider<P> extends BaseProvider<P> {
  multi: boolean;
}

export interface TypedTypeProvider<T> extends Type<T> {}

export interface TypedValueProvider<P, T> extends BaseProvider<P> {
  useValue: T;
}

export interface TypedValueMultiProvider<P, T>
  extends TypedValueProvider<P, InferArray<T>>,
    BaseMultiProvider<P> {}

export interface TypedClassProvider<P, T> extends BaseProvider<P> {
  useClass: Type<T>;
}

export interface TypedClassMultiProvider<P, T>
  extends TypedClassProvider<P, InferArray<T>>,
    BaseMultiProvider<P> {}

export interface TypedConstructorProvider<P, T> extends BaseProvider<Type<P>> {
  deps?: any[];
  multi?: boolean;
}

export interface TypedExistingProvider<P, T> extends BaseProvider<P> {
  useExisting: AnyProviderToken<T>;
}

export interface TypedExistingMultiProvider<P, T>
  extends TypedExistingProvider<P, InferArray<T>>,
    BaseMultiProvider<P> {}

export interface TypedFactoryProvider<P, T> extends BaseProvider<P> {
  useFactory: TypedFunction<T, any>;
  deps?: any[];
}

export interface TypedFactoryDepsProvider<
  P,
  T,
  F extends TypedFunction<T, any> = TypedFunction<T, any>
> extends BaseProvider<P> {
  useFactory: F;
  deps: DepsOfFactory<F>;
}

export interface TypedFactoryDepsMultiProvider<
  P,
  T,
  F extends TypedFunction<T, any> = TypedFunction<T, any>
> extends BaseMultiProvider<P> {
  useFactory: F;
  deps: DepsOfFactory<F>;
}

export interface TypedFactoryMultiProvider<P, T>
  extends TypedFactoryProvider<P, InferArray<T>>,
    BaseMultiProvider<P> {}

export type DepsOfFactory<T extends AnyFunction, A = Parameters<T>> = {
  [K in keyof A]: AnyProviderToken<A[K]>;
} &
  any[];
