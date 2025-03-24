/**
 * Ergan Query
 *
 * Copyright (c) 2025, Ömer Ergan. All rights reserved.
 *
 * A lightweight query management and mutation library that provides caching,
 * invalidation, and data fetching functionalities across JavaScript applications.
 * It offers a comprehensive solution for handling asynchronous data. Additionally,
 * it provides a set of custom hooks for React, making integration with UI components seamless.
 */
import { QueryFn, QueryKey } from './types.ts';

/** Plugin lifecycle hooks */
type PluginHooks = {
    onQueryStart?: (key: string) => void;
    onQuerySuccess?: (key: string, data: any) => void;
    onQueryError?: (key: string, error: any) => void;
    onInvalidate?: (key: string) => void;
};

export type Plugin = (client: QueryClient) => PluginHooks | void;

class QueryClient {
    /** @private */
    private cache = new Map<string, any>();

    /** @private */
    private subscribers = new Map<string, Set<() => void>>();

    /** @private */
    private queryFns = new Map<string, QueryFn<any>>();

    /** @private */
    private pluginHooks: PluginHooks[] = [];

    /**
     * Registers a plugin that can hook into query lifecycle events.
     *
     * @param {Plugin} plugin - A plugin function that optionally returns hook implementations.
     */
    use(plugin: Plugin): void {
        const hooks = plugin(this);
        if (hooks) {
            this.pluginHooks.push(hooks);
        }
    }

    /**
     * Internal: Triggers a specific plugin hook if available.
     *
     * @template K
     * @param {K} hook - The lifecycle event key.
     * @param {...any[]} args - Arguments passed to the hook function.
     */
    private runHook<K extends keyof PluginHooks>(hook: K, ...args: Parameters<NonNullable<PluginHooks[K]>>): void {
        for (const plugin of this.pluginHooks) {
            const fn = plugin[hook];
            if (fn) { // @ts-ignore
                fn(...args);
            }
        }
    }

    /**
     * Returns the cached value for the provided query key.
     *
     * @template T
     * @param {QueryKey} queryKey - The key identifying the cached query data.
     * @returns {T | undefined} The cached query data, or undefined if no data exists.
     */
    getQueryData<T>(queryKey: QueryKey): T | undefined {
        const key = queryKey ? JSON.stringify(queryKey) : 'undefined';
        return this.cache.get(key);
    }

    /**
     * Returns cached data if available; otherwise, executes the query function,
     * caches the result, and returns it. Also stores the query function for later refetching.
     *
     * @template T
     * @param {QueryKey} queryKey - The key used to cache and identify the query data.
     * @param {QueryFn<T>} queryFn - The function that fetches or computes the query data.
     * @returns {Promise<T>} A promise that resolves to the query data.
     */
    async ensureQueryData<T>(queryKey: QueryKey, queryFn: QueryFn<T>): Promise<T> {
        const key = queryKey ? JSON.stringify(queryKey) : 'undefined';

        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        this.runHook('onQueryStart', key);

        try {
            const data = await queryFn();
            this.cache.set(key, data);
            this.queryFns.set(key, queryFn);
            this.runHook('onQuerySuccess', key, data);
            return data;
        } catch (error) {
            this.runHook('onQueryError', key, error);
            throw error;
        }
    }

    /**
     * Always executes the query function, caches the result (overwriting any existing value),
     * and returns the new data. Also stores the query function for later refetching.
     *
     * @template T
     * @param {QueryKey} queryKey - The key used to cache and identify the query data.
     * @param {QueryFn<T>} queryFn - The function that fetches or computes the query data.
     * @returns {Promise<T>} A promise that resolves to the fresh query data.
     */
    async fetchQuery<T>(queryKey: QueryKey, queryFn: QueryFn<T>): Promise<T> {
        const key = queryKey ? JSON.stringify(queryKey) : 'undefined';

        this.runHook('onQueryStart', key);

        try {
            const data = await queryFn();
            this.cache.set(key, data);
            this.queryFns.set(key, queryFn);
            this.runHook('onQuerySuccess', key, data);
            return data;
        } catch (error) {
            this.runHook('onQueryError', key, error);
            throw error;
        }
    }

    /**
     * Refetches the data for the given query key using the stored query function.
     * If no query function is available for the key, an error is thrown.
     *
     * @template T
     * @param {QueryKey} queryKey - The key identifying the cached query data.
     * @returns {Promise<T>} A promise that resolves to the fresh query data.
     */
    async refetch<T>(queryKey: QueryKey): Promise<T> {
        const key = queryKey ? JSON.stringify(queryKey) : 'undefined';
        const queryFn = this.queryFns.get(key);
        if (!queryFn) {
            throw new Error(`No query function found for key: ${key}`);
        }
        const data = await this.fetchQuery(queryKey, queryFn);
        if (this.subscribers.has(key)) {
            this.subscribers.get(key)!.forEach((callback) => callback());
        }
        return data;
    }

    /**
     * Invalidates (removes) the cached data for the provided query key.
     * Optionally triggers subscriber callbacks if shouldRefetchOnInvalidate is true.
     *
     * @param {QueryKey} queryKey - The key identifying the cached query data to be invalidated.
     * @param {boolean} [shouldRefetchOnInvalidate=true] - If true, any subscribers registered for this query key will be notified that the data was invalidated.
     */
    invalidateQuery(queryKey: QueryKey, shouldRefetchOnInvalidate: boolean): void {
        const key = queryKey ? JSON.stringify(queryKey) : 'undefined';
        this.cache.delete(key);
        this.runHook('onInvalidate', key);

        if (shouldRefetchOnInvalidate && this.subscribers.has(key)) {
            this.subscribers.get(key)!.forEach((callback) => callback());
        }
    }

    /**
     * Subscribe to invalidation events for a given query key.
     *
     * @param {QueryKey} queryKey - The key to subscribe to.
     * @param {() => void} callback - The callback to invoke when the query is invalidated.
     */
    subscribe(queryKey: QueryKey, callback: () => void): void {
        const key = queryKey ? JSON.stringify(queryKey) : 'undefined';
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key)!.add(callback);
    }

    /**
     * Unsubscribe from invalidation events for a given query key.
     *
     * @param {QueryKey} queryKey - The key to unsubscribe from.
     * @param {() => void} callback - The callback to remove.
     */
    unsubscribe(queryKey: QueryKey, callback: () => void): void {
        const key = queryKey ? JSON.stringify(queryKey) : 'undefined';
        this.subscribers.get(key)?.delete(callback);
    }
}

export const queryClient = new QueryClient();
(window as any).queryClient = queryClient;
