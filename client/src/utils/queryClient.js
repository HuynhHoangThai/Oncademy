import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes - cache data for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch when window gains focus
      refetchOnMount: false, // Don't refetch on component mount if data is fresh
      retry: 1, // Retry failed requests once
      retryDelay: 1000, // Wait 1 second before retrying
    },
    mutations: {
      retry: 0, // Don't retry mutations
    },
  },
});

export default queryClient;

