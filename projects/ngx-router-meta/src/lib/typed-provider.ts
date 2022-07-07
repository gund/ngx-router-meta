import { InjectionToken, Type } from '@angular/core';

export type TypedFunction<R, A extends any[]> = (...args: A) => R;

export type AnyFunction = TypedFunction<any, any>;

export type AnyProviderToken<T> = AbstractType<T> | Type<T> | InjectionToken<T>;

export interface AbstractType<T> {
  prototype: T;
}
