import { createEffect, createSignal, onCleanup } from 'solid-js';
import type { QueryFn, QueryKey } from './core/types.ts';
import { queryClient } from './index.ts';

/**
 * SolidJS hook to fetch and manage query data.
 *
 * This hook automatically fetches data using the provided query function,
 * caches it via the global queryClient, and subscribes to cache invalidation events.
 * It returns Solid signals for the data, error, and loading state, as well as a function
 * to manually refetch the data.
 *
 * @template T - The type of data returned by the query function.
 * @param {QueryKey} queryKey - The unique key for the query data.
 * @param {QueryFn<T>} queryFn - The function that fetches the query data.
 * @returns {{
 *   data: () => T | undefined,
 *   error: () => unknown,
 *   isLoading: () => boolean,
 *   refetch: () => void
 * }} An object containing signals for the data, error, loading state, and a refetch function.
 */
export function useQuery<T>(queryKey: QueryKey, queryFn: QueryFn<T>) {
    const [data, setData] = createSignal<T | undefined>(undefined);
    const [error, setError] = createSignal<unknown>(null);
    const [isLoading, setIsLoading] = createSignal<boolean>(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const result = await queryClient.ensureQueryData(queryKey, queryFn);
            setData(() => result); // ✅ Ensures Solid updates correctly
        } catch (err) {
            setError(() => err);
        } finally {
            setIsLoading(false);
        }
    };

    createEffect(() => {
        fetchData();
    });

    createEffect(() => {
        const handleInvalidation = () => fetchData();
        queryClient.subscribe(queryKey, handleInvalidation);
        onCleanup(() => queryClient.unsubscribe(queryKey, handleInvalidation));
    });

    return { data, error, isLoading, refetch: fetchData };
}

// === SolidJS Version of `useMutation` ===

/**
 * SolidJS hook for performing mutations and optionally invalidating query caches.
 *
 * This hook returns a mutation function along with signals for the mutation result,
 * any error, and the loading state. After a successful mutation, it can optionally
 * invalidate specific query keys to trigger refetching.
 *
 * @template T - The type of data returned by the mutation function.
 * @template Vars - A tuple representing the types of the arguments accepted by the mutation function.
 * @param {(...variables: Vars) => Promise<T> | T} mutationFn - The function that performs the mutation.
 * @param {object} [options] - Optional configuration for the mutation.
 * @param {QueryKey[]} [options.invalidateKeys] - An array of query keys to invalidate after the mutation.
 * @param {boolean} [options.shouldRefetchOnInvalidate=true] - Whether to refetch invalidated queries.
 * @returns {{
 *   mutate: (...variables: Vars) => Promise<T>,
 *   data: () => T | undefined,
 *   error: () => unknown,
 *   isLoading: () => boolean
 * }} An object containing the mutation function, signals for the data, error, and loading state.
 */
export function useMutation<T, Vars extends any[] = []>(
    mutationFn: (...variables: Vars) => Promise<T> | T,
    options?: {
        invalidateKeys?: QueryKey[];
        shouldRefetchOnInvalidate?: boolean;
    },
) {
    const { invalidateKeys, shouldRefetchOnInvalidate = true } = options || {};
    const [data, setData] = createSignal<T | undefined>(undefined);
    const [error, setError] = createSignal<unknown>(null);
    const [isLoading, setIsLoading] = createSignal<boolean>(false);

    const mutate = async (...variables: Vars): Promise<T> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await mutationFn(...variables);
            setData(() => result); // ✅ Fix: Ensure data updates correctly

            if (invalidateKeys?.length) {
                invalidateKeys.forEach((key) => {
                    queryClient.invalidateQuery(key, shouldRefetchOnInvalidate);
                });
            }
            return result;
        } catch (err) {
            setError(() => err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return { mutate, data, error, isLoading };
}
