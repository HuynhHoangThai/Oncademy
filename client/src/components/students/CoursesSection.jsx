import React from 'react'
import {Link} from 'react-router-dom'
import { useCourses } from '../../hooks/useCourses';
import CourseCard from './CourseCard';
import { CourseListSkeleton } from './SkeletonLoader';

const CoursesSection = () => {
  // Fetch first 4 courses for homepage
  const { data, isLoading } = useCourses({ page: 1, limit: 4 });
  const courses = data?.courses || [];
  
  return (
    <div className="py-16 md:px-40 px-8">
       <h2 className="text-3xl font-medium text-gray-800">Learn from the best</h2>
      <p className="md:text-base text-sm text-gray-500 mt-3">
        Discover our top-rated courses across various categories. From coding and design to business and wellness, our courses are crafted to deliver results.
      </p>
      {isLoading ? (
        <CourseListSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-4 md:px-0 md:my-16 my-10 gap-4">
          {courses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
      <Link to={'/course-list'} onClick={() => scrollTo(0, 0)} className="text-gray-500 border border-gray-500/30 px-10 py-3 rounded mt-8 inline-block">Show all courses</Link>
    </div>
  )
}

export default CoursesSection
