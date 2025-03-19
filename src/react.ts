import { useCallback, useEffect, useRef, useSyncExternalStore, useState } from 'react';
import type { QueryFn, QueryKey } from './core/types.ts';
import { queryClient } from './index.ts';

interface QuerySnapshot<T> {
    data: T | undefined;
    isLoading: boolean;
}

/**
 * Custom React hook that fetches query data using the global queryClient.
 * It maintains state for the data, any error encountered, and the loading status.
 *
 * @template T
 * @param {QueryKey} queryKey - The key used to uniquely identify the query data.
 * @param {QueryFn<T>} queryFn - The function that fetches or computes the query data.
 * @returns {{
 *   data: T | undefined,
 *   error: unknown,
 *   isLoading: boolean,
 *   refetch: () => void
 * }}
 *   An object containing the query data, any error encountered, the loading state, and a refetch function.
 */
export function useQuery<T>(
    queryKey: QueryKey,
    queryFn: QueryFn<T>,
): {
    data: T | undefined;
    error: unknown;
    isLoading: boolean;
    refetch: () => void;
} {
    const [error, setError] = useState<unknown>(null);
    const serializedKey = JSON.stringify(queryKey);

    // Ref to store the last snapshot object.
    const lastSnapshotRef = useRef<QuerySnapshot<T> | null>(null);

    const getSnapshot = useCallback((): QuerySnapshot<T> => {
        const cached = queryClient.getQueryData<T>(queryKey);
        // If the cached value hasn't changed, return the same snapshot reference.
        if (lastSnapshotRef.current && lastSnapshotRef.current.data === cached) {
            return lastSnapshotRef.current;
        }
        const newSnapshot: QuerySnapshot<T> = {
            data: cached,
            isLoading: cached === undefined,
        };
        lastSnapshotRef.current = newSnapshot;
        return newSnapshot;
    }, [serializedKey, queryKey]);

    const subscribe = useCallback(
        (onStoreChange: () => void): (() => void) => {
            queryClient.subscribe(queryKey, onStoreChange);
            return () => queryClient.unsubscribe(queryKey, onStoreChange);
        },
        [serializedKey, queryKey],
    );

    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    const data = snapshot.data;
    const isLoading = snapshot.isLoading && error === null;

    const fetchData = useCallback((): void => {
        queryClient
            .ensureQueryData<T>(queryKey, queryFn)
            .then(() => {
                setError(null);
            })
            .catch((err) => {
                setError(err);
            });
    }, [serializedKey, queryKey, queryFn]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refetch = useCallback((): void => {
        fetchData();
    }, [fetchData]);

    return { data, error, isLoading, refetch };
}

/**
 * Custom React hook for performing mutations and optionally invalidating query caches.
 * It returns the mutation function along with the mutation result, error, and loading state.
 *
 * @template T - The type of data returned by the mutation function.
 * @template Vars - A tuple representing the types of the arguments accepted by the mutation function.
 * @param {(...variables: Vars) => Promise<T> | T} mutationFn - The function that performs the mutation.
 * @param {object} [options] - Optional configuration object.
 * @param {QueryKey[]} [options.invalidateKeys] - An optional array of query keys to invalidate upon a successful mutation.
 * @param {boolean} [options.shouldRefetchOnInvalidate=true] - If true, refetches invalidated queries after mutation; otherwise, invalidates silently.
 * @returns {{
 *   mutate: (...variables: Vars) => Promise<T>,
 *   data: T | undefined,
 *   error: unknown,
 *   isLoading: boolean
 * }} An object containing the mutate function, the mutation result data, any error encountered, and the loading state.
 */
export function useMutation<T, Vars extends any[] = []>(
    mutationFn: (...variables: Vars) => Promise<T> | T,
    options?: {
        invalidateKeys?: QueryKey[];
        shouldRefetchOnInvalidate?: boolean;
    },
) {
    const { invalidateKeys, shouldRefetchOnInvalidate = true } = options || {};
    const [data, setData] = useState<T | undefined>(undefined);
    const [error, setError] = useState<unknown>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const mutate = useCallback(
        async (...variables: Vars): Promise<T> => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await mutationFn(...variables);
                setData(result);
                setIsLoading(false);

                // Invalidate each provided query key after a successful mutation.
                if (invalidateKeys && invalidateKeys.length > 0) {
                    invalidateKeys.forEach((key) => {
                        queryClient.invalidateQuery(key, shouldRefetchOnInvalidate);
                    });
                }
                return result;
            } catch (err) {
                setError(err);
                setIsLoading(false);
                throw err;
            }
        },
        [mutationFn, invalidateKeys, shouldRefetchOnInvalidate],
    );

    return { mutate, data, error, isLoading };
}
