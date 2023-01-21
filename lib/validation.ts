type Require<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

type Ensure<U, K extends PropertyKey> = K extends keyof U
  ? Require<U, K>
  : U & Record<K, unknown>;

export function hasOwnProperty<X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is Ensure<X, Y> {
  return obj.hasOwnProperty(prop);
}

export function isPlainObject(value: unknown): value is {} {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
