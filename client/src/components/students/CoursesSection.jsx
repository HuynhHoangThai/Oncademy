import React from 'react'
import { Link } from 'react-router-dom'
import { useCourses } from '../../hooks/useCourses';
import { usePathways } from '../../hooks/usePathways';
import CourseCard from './CourseCard';
import PathwayCard from './PathwayCard';
import { CourseListSkeleton } from './SkeletonLoader';

const CoursesSection = () => {
  // Fetch first 4 courses for homepage
  const { data, isLoading } = useCourses({ page: 1, limit: 4 });
  const courses = data?.courses || [];

  // Fetch first 4 pathways for homepage
  const { data: pathwayData, isLoading: isPathwayLoading } = usePathways({ page: 1, limit: 4 });
  const pathways = pathwayData?.pathways || [];

  return (
    <div className="py-16 md:px-40 px-8">
      <h2 className="text-3xl font-medium text-gray-800">Learn from the best</h2>
      <p className="md:text-base text-sm text-gray-500 mt-3">
        Discover our top-rated courses across various categories. From coding and design to business and wellness, our courses are crafted to deliver results.
      </p>

      {/* Course Combos Section */}
      {pathways.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-2xl font-semibold text-gray-800">Featured Course Combos</h3>
            <span className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full font-bold">NEW</span>
          </div>

          {isPathwayLoading ? (
            <CourseListSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-4 md:px-0 gap-4">
              {pathways.map((pathway) => (
                <PathwayCard key={pathway._id} pathway={pathway} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Individual Courses Section */}
      <div className="mt-12">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6"> Courses</h3>
        {isLoading ? (
          <CourseListSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-4 md:px-0 gap-4">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>

      <Link to={'/course-list'} onClick={() => scrollTo(0, 0)} className="text-gray-500 border border-gray-500/30 px-10 py-3 rounded mt-8 inline-block">Show all courses</Link>
    </div>
  )
}

export default CoursesSection
