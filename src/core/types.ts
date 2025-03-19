/**
 * A function that returns data either synchronously or asynchronously.
 *
 * @template T
 * @typedef {() => Promise<T> | T} QueryFn
 */
export type QueryFn<T> = () => Promise<T> | T;

/**
 * An array used to uniquely identify a query.
 *
 * @typedef {any[]} QueryKey
 */
export type QueryKey = any[];
