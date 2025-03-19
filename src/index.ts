// src/index.ts

// Import only the core logic and types, avoiding React or Solid references
import { queryClient } from './core/queryClient';
import type { QueryKey, QueryFn } from './core/types';

// Export the default queryClient instance
export { queryClient };

// Optionally re-export the types so users can import them if needed
export type { QueryKey, QueryFn };
