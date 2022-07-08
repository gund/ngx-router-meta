export interface Indexable<T> {
  [k: string]: T;
}

export type InferArray<A> = A extends Array<infer T> ? T : never;

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;
