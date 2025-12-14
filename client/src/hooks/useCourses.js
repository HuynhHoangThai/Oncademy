import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import api from '../utils/api';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Fetch courses with pagination
export const useCourses = (options = {}) => {
  const { page = 1, limit = 12, search = '', sort = 'createdAt', order = 'desc' } = options;

  return useQuery({
    queryKey: ['courses', page, limit, search, sort, order],
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
      const response = await api.get(`${backendUrl}/api/course/all?${params.toString()}`);
      // API returns { success, courses, pagination }
      if (response?.success) {
        return response;
      }
      throw new Error(response?.message || 'Failed to fetch courses');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  });
};

// Fetch single course
export const useCourse = (courseId) => {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await api.get(`${backendUrl}/api/course/${courseId}`);
      if (response?.success) {
        return response;
      }
      throw new Error(response?.message || 'Failed to fetch course');
    },
    enabled: !!courseId, // Only fetch if courseId exists
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Fetch educator courses
export const useEducatorCourses = (options = {}) => {
  const { getToken } = useAuth();
  const { page = 1, limit = 12 } = options;

  return useQuery({
    queryKey: ['educator-courses', page, limit],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await api.get(`${backendUrl}/api/educator/courses?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response?.success) {
        return response;
      }
      throw new Error(response?.message || 'Failed to fetch courses');
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};

