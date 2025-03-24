# ergan-query

**ergan-query** is a lightweight query management and mutation library that provides caching, invalidation, and data
fetching functionalities for JavaScript applications. With support for both React and Solid, this library offers a
comprehensive solution for handling asynchronous data in modern web apps.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
    - [Basic Usage](#basic-usage)
    - [React Example](#react-example)
    - [Solid Example](#solid-example)
- [API Reference](#api-reference)
    - [QueryClient](#queryclient)
    - [React Hooks](#react-hooks)
    - [Solid Hooks](#solid-hooks)
- [TypeScript Usage](#typescript-usage)
    - [Example: Using QueryClient with TypeScript](#example-using-queryclient-with-typescript)
    - [Example: React with TypeScript](#example-react-with-typescript)
    - [Example: Solid with TypeScript](#example-solid-with-typescript)
- [License](#license)

## Features

- **Caching:** Stores query results in a centralized cache for improved performance.
- **Invalidation:** Easily invalidate cached queries to trigger refetches.
- **Refetching:** Seamlessly refetch data when needed.
- **Subscriptions:** Listen for changes in query data and update UI automatically.
- **Custom Hooks for React & Solid:** Built-in hooks (`useQuery` and `useMutation`) for effortless integration.
- **Zero Dependencies:** Minimal overhead with no extra runtime dependencies.

## Installation

Install via npm or your preferred package manager:

```bash
# Using npm
npm install ergan-query

# Using pnpm
pnpm add ergan-query

# Using yarn
yarn add ergan-query
```

## Quick Start

This example shows how to fetch data, manually invalidate the query (without mutation), and then refetch fresh data—all
using async/await.

```ts
import { queryClient } from 'ergan-query';

// Define a query function
const fetchData = async () => {
    const response = await fetch('https://api.example.com/data');
    return response.json();
};

const runQueries = async () => {
    try {
        // Fetch and cache data
        const data = await queryClient.ensureQueryData(['data'], fetchData);
        console.log('Fetched data:', data);

        // Manually invalidate the query without a mutation
        queryClient.invalidateQuery(['data']);
        console.log('Query invalidated');

        // Refetch the data after invalidation
        const freshData = await queryClient.refetch(['data']);
        console.log('Refetched data:', freshData);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

runQueries();
```

### React Example

Use the provided custom hooks in your React components:

```tsx
import React from 'react';
import { useQuery, useMutation } from 'ergan-query/react';

// Example query function
const fetchData = async () => {
    const res = await fetch('https://api.example.com/data');
    return res.json();
};

export function DataComponent() {
    const { data, error, isLoading, refetch } = useQuery(['data'], fetchData);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {String(error)}</div>;

    return (
        <div>
            <h1>Data</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
            <button onClick={refetch}>Refetch</button>
        </div>
    );
}

// Example mutation function
const updateData = async (newData: any) => {
    const res = await fetch('https://api.example.com/data', {
        method: 'POST',
        body: JSON.stringify(newData),
        headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
};

export function UpdateComponent() {
    const { mutate, isLoading, error } = useMutation(updateData, {
        invalidateKeys: [['data']],
    });

    const handleUpdate = async () => {
        try {
            const result = await mutate({ key: 'value' });
            console.log('Update successful:', result);
        } catch (err) {
            console.error('Update failed:', err);
        }
    };

    return (
        <div>
            <button onClick={handleUpdate} disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Data'}
            </button>
            {error && <p>Error: {String(error)}</p>}
        </div>
    );
}
```

### Solid Example

Use the SolidJS hooks for data management:

```tsx
import { createSignal } from 'solid-js';
import { useQuery, useMutation } from 'ergan-query/solid';

const fetchData = async () => {
    const res = await fetch('https://api.example.com/data');
    return res.json();
};

export function DataComponent() {
    const { data, error, isLoading, refetch } = useQuery(['data'], fetchData);

    return (
        <div>
            <h1>Data</h1>
            {isLoading() && <p>Loading...</p>}
            {error() && <p>Error: {String(error())}</p>}
            <pre>{JSON.stringify(data(), null, 2)}</pre>
            <button onClick={refetch}>Refetch</button>
        </div>
    );
}

const updateData = async (newData) => {
    const res = await fetch('https://api.example.com/data', {
        method: 'POST',
        body: JSON.stringify(newData),
        headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
};

export function UpdateComponent() {
    const { mutate, isLoading, error } = useMutation(updateData, {
        invalidateKeys: [['data']],
    });

    const handleUpdate = async () => {
        try {
            const result = await mutate({ key: 'value' });
            console.log('Updated successfully', result);
        } catch (err) {
            console.error('Update failed', err);
        }
    };

    return (
        <div>
            <button onClick={handleUpdate} disabled={isLoading()}>
                {isLoading() ? 'Updating...' : 'Update Data'}
            </button>
            {error() && <p>Error: {String(error())}</p>}
        </div>
    );
}
```

## API Reference

### QueryClient

The core class for managing query data. It provides methods for caching, refetching, and invalidating queries.

#### Methods

- **`getQueryData<T>(queryKey: QueryKey): T | undefined`**  
  Retrieves the cached data for the provided query key.

- **`ensureQueryData<T>(queryKey: QueryKey, queryFn: QueryFn<T>): Promise<T>`**  
  Returns the cached data if available; otherwise, fetches data using `queryFn` and caches it.

- **`fetchQuery<T>(queryKey: QueryKey, queryFn: QueryFn<T>): Promise<T>`**  
  Always fetches fresh data using `queryFn` and updates the cache.

- **`refetch<T>(queryKey: QueryKey): Promise<T>`**  
  Refetches data for the given query key using the stored query function and notifies subscribers.

- **`invalidateQuery(queryKey: QueryKey, shouldRefetchOnInvalidate?: boolean): void`**  
  Invalidates the cached data and optionally triggers refetching for subscribers.

- **`subscribe(queryKey: QueryKey, callback: () => void): void`**  
  Subscribes to changes/invalidation events for the specified query key.

- **`unsubscribe(queryKey: QueryKey, callback: () => void): void`**  
  Removes a subscription for the specified query key.

### React Hooks

- **
  `useQuery<T>(queryKey: QueryKey, queryFn: QueryFn<T>): { data: T | undefined, error: unknown, isLoading: boolean, refetch: () => void }`
  **  
  A custom hook to fetch and manage query data in React components.

- **
  `useMutation<T, Vars extends any[] = []>(mutationFn: (...variables: Vars) => Promise<T> | T, options?: { invalidateKeys?: QueryKey[], shouldRefetchOnInvalidate?: boolean }): { mutate: (...variables: Vars) => Promise<T>, data: T | undefined, error: unknown, isLoading: boolean }`
  **  
  A custom hook to perform mutations and optionally invalidate query caches.

### Solid Hooks

- **
  `useQuery<T>(queryKey: QueryKey, queryFn: QueryFn<T>): { data: () => T | undefined, error: () => unknown, isLoading: () => boolean, refetch: () => void }`
  **  
  A SolidJS hook for fetching and managing query data.

- **
  `useMutation<T, Vars extends any[] = []>(mutationFn: (...variables: Vars) => Promise<T> | T, options?: { invalidateKeys?: QueryKey[], shouldRefetchOnInvalidate?: boolean }): { mutate: (...variables: Vars) => Promise<T>, data: () => T | undefined, error: () => unknown, isLoading: () => boolean }`
  **  
  A SolidJS hook to perform mutations with optional cache invalidation.

## TypeScript Usage

**ergan-query** is written in TypeScript, providing robust type definitions out-of-the-box. This section illustrates how
to leverage TypeScript for type safety and improved developer experience when using the library.

### Example: Using QueryClient with TypeScript

Define your data types and then use the `queryClient` with explicit types:

```ts
// types.ts
export interface User {
    id: number;
    name: string;
    email: string;
}
```

Now, use these types with your query functions:

```ts
import { queryClient } from 'ergan-query';
import type { User } from './types';

const fetchUser = async (): Promise<User> => {
    const response = await fetch('https://api.example.com/user');
    if (!response.ok) {
        throw new Error('Failed to fetch user');
    }
    return response.json();
};

async function getUser() {
    try {
        const user = await queryClient.ensureQueryData<User>(['user'], fetchUser);
        console.log(`User name: ${user.name}`);
    } catch (error) {
        console.error(error);
    }
}

getUser();
```

### Example: React with TypeScript

When using React, you can specify types for your query data and mutation responses:

```tsx
import React from 'react';
import { useQuery, useMutation } from 'ergan-query/react';
import type { User } from './types';

const fetchUser = async (): Promise<User> => {
    const res = await fetch('https://api.example.com/user');
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
};

export function UserComponent() {
    const { data, error, isLoading, refetch } = useQuery<User>(['user'], fetchUser);

    if (isLoading) return <div>Loading user...</div>;
    if (error) return <div>Error: {String(error)}</div>;

    return (
        <div>
            <h1>{data?.name}</h1>
            <p>{data?.email}</p>
            <button onClick={refetch}>Refetch User</button>
        </div>
    );
}

const updateUser = async (newData: Partial<User>): Promise<User> => {
    const res = await fetch('https://api.example.com/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
};

export function UpdateUserComponent() {
    const { mutate, isLoading, error } = useMutation<User, [Partial<User>]>(updateUser, {
        invalidateKeys: [['user']],
    });

    const handleUpdate = async () => {
        try {
            const updatedUser = await mutate({ name: 'New Name' });
            console.log('User updated:', updatedUser);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <button onClick={handleUpdate} disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update User'}
            </button>
            {error && <p>Error: {String(error)}</p>}
        </div>
    );
}
```

### Example: Solid with TypeScript

Similarly, SolidJS examples benefit from TypeScript’s strong type checking:

```tsx
import { createSignal } from 'solid-js';
import { useQuery, useMutation } from 'ergan-query/solid';
import type { User } from './types';

const fetchUser = async (): Promise<User> => {
    const res = await fetch('https://api.example.com/user');
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
};

export function UserComponent() {
    const { data, error, isLoading, refetch } = useQuery<User>(['user'], fetchUser);

    return (
        <div>
            <h1>{data()?.name}</h1>
            <p>{data()?.email}</p>
            {isLoading() && <p>Loading...</p>}
            {error() && <p>Error: {String(error())}</p>}
            <button onClick={refetch}>Refetch User</button>
        </div>
    );
}

const updateUser = async (newData: Partial<User>): Promise<User> => {
    const res = await fetch('https://api.example.com/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
};

export function UpdateUserComponent() {
    const { mutate, isLoading, error } = useMutation<User, [Partial<User>]>(updateUser, {
        invalidateKeys: [['user']],
    });

    const handleUpdate = async () => {
        try {
            const updatedUser = await mutate({ name: 'Updated Name' });
            console.log('User updated:', updatedUser);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <button onClick={handleUpdate} disabled={isLoading()}>
                {isLoading() ? 'Updating...' : 'Update User'}
            </button>
            {error() && <p>Error: {String(error())}</p>}
        </div>
    );
}
```

These examples demonstrate how to use ergan-query with TypeScript for enhanced type safety and a better development
experience in both React and Solid environments.

## License

This project is licensed under the [MIT License](LICENSE).

---

Happy coding!
