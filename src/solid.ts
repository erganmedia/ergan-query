import { createEffect, createSignal, onCleanup } from 'solid-js';
import type { QueryFn, QueryKey } from './types.ts';
import { queryClient } from './index.ts';

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
