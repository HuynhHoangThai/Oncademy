import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Fetch pathways with pagination
export const usePathways = (options = {}) => {
    const { page = 1, limit = 12, search = '', sort = 'createdAt', order = 'desc' } = options;

    return useQuery({
        queryKey: ['pathways', page, limit, search, sort, order],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                sort,
                order,
            });
            if (search) {
                params.append('search', search);
            }
            const response = await api.get(`${backendUrl}/api/pathway/all?${params.toString()}`);
            // API returns { success, pathways, pagination }
            if (response?.success) {
                return response;
            }
            throw new Error(response?.message || 'Failed to fetch pathways');
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        placeholderData: (previousData) => previousData,
    });
};

// Fetch single pathway
export const usePathway = (pathwayId) => {
    return useQuery({
        queryKey: ['pathway', pathwayId],
        queryFn: async () => {
            const response = await api.get(`${backendUrl}/api/pathway/${pathwayId}`);
            if (response?.success) {
                return response;
            }
            throw new Error(response?.message || 'Failed to fetch pathway');
        },
        enabled: !!pathwayId,
        staleTime: 10 * 60 * 1000,
    });
};
