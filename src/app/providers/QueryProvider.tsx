'use client';

import { ReactNode, useState } from 'react';
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { toast } from 'sonner';

/** Single client instance + defaults: fewer refetches, stable cache across re-renders. Per-query `staleTime` still overrides. */
function createAppQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        const message =
          error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.';
        toast.error(message);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  });
}

const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(createAppQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export { QueryProvider };
