import React from 'react';

export const CourseCardSkeleton = () => (
  <div className="bg-white border border-gray-200 shadow-md rounded-lg overflow-hidden animate-pulse">
    <div className="bg-gray-200 h-48 w-full"></div>
    <div className="p-4">
      <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
      <div className="bg-gray-200 h-3 rounded w-1/2 mb-3"></div>
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-gray-200 h-3 rounded w-8"></div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-gray-200 h-3 w-3 rounded"></div>
          ))}
        </div>
        <div className="bg-gray-200 h-3 rounded w-12"></div>
      </div>
      <div className="bg-gray-200 h-5 rounded w-20"></div>
    </div>
  </div>
);

export const CourseListSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <CourseCardSkeleton key={i} />
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow">
          <div className="bg-gray-200 h-4 rounded w-1/2 mb-4"></div>
          <div className="bg-gray-200 h-8 rounded w-3/4"></div>
        </div>
      ))}
    </div>
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="bg-gray-200 h-6 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-gray-200 h-4 rounded"></div>
        ))}
      </div>
    </div>
  </div>
);

export default CourseCardSkeleton;

