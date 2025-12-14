import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import api from '../utils/api';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Fetch educator dashboard data
export const useDashboard = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const token = await getToken();
      const response = await api.get(`${backendUrl}/api/educator/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response?.success) {
        return response;
      }
      throw new Error(response?.message || 'Failed to fetch dashboard');
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    refetchIntervalInBackground: false, // Only refetch when tab is visible
  });
};

