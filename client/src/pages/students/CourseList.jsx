
import { useState, useEffect, useMemo, useContext } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import SearchBar from '../../components/students/SearchBar'
import CourseCard from '../../components/students/CourseCard'
import PathwayCard from '../../components/students/PathwayCard'
import { assets } from '../../assets/assets'
import Footer from '../../components/students/Footer'
import { useCourses } from '../../hooks/useCourses'
import { CourseListSkeleton } from '../../components/students/SkeletonLoader'
import { useDebounce } from '../../hooks/useDebounce'

const CourseList = () => {
  const { input } = useParams()
  const navigate = useNavigate()
  const { allPathways } = useContext(AppContext)
  const [page, setPage] = useState(1)



  // Debounce search input
  const debouncedSearch = useDebounce(input || '', 300)

  // Fetch courses with React Query
  const { data, isLoading, error, isFetching } = useCourses({
    page,
    limit: 12,
    search: debouncedSearch,
    sort: 'createdAt',
    order: 'desc'
  })

  const courses = data?.courses || []
  const pagination = data?.pagination



  // Filter courses by search only (price filter removed)
  const filteredCourses = useMemo(() => {
    // If we wanted to client-side filter by search (already done in API query usually, but keeping robust)
    // Actually useCourses handles search via API. 'courses' is already filtered by search if backend does it?
    // Looking at useCourses: yes, it passes 'search' to API.
    // But let's check if 'courses' needs additional client side filtering? 
    // The previous code filtered 'courses' by priceRange. 
    // 'courses' here is the result of useCourses hook.
    // If useCourses returns filtered results, we might just use 'courses' as is, or filter if we want to support extra checks.
    // But since price filter is gone, we can probably just use 'courses' if we trust the API search.
    // However, keeping consistent with previous structure where filteredCourses was used for mapping.
    return courses;
  }, [courses])

  const filteredPathways = useMemo(() => {
    if (!allPathways) return [];
    if (!debouncedSearch) return allPathways; // Show all if no search

    return allPathways.filter(pathway => {
      return pathway.pathwayTitle.toLowerCase().includes(debouncedSearch.toLowerCase());
    });
  }, [allPathways, debouncedSearch]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])


  return (
    <div className="min-h-screen flex flex-col">
      <div className="relative md:px-36 px-8 pt-20 text-left bg-gradient-to-b from-cyan-100/70 pb-8">
        <div className='flex md:flex-row flex-col gap-6 items-start justify-between w-full'>
          <div>
            <h1 className='text-4xl font-semibold text-gray-800'>Course List</h1>
            <p className='text-gray-500'>
              <span className='text-blue-600 cursor-pointer'
                onClick={() => navigate('/')}>Home</span> / <span>Course List </span></p>
          </div>
          <SearchBar data={input} />
        </div>
        {input && <div className='inline-flex items-center gap-4 px-4 py-2 border mt-8 -mb-8 text-gray-600 bg-white rounded-lg shadow-sm'>
          <p>{input}</p>
          <img onClick={() => navigate('/course-list')} className='cursor-pointer' src={assets.cross_icon} alt="" />
        </div>}
      </div>


      <div className="mt-8 md:px-36 px-8 flex-grow">
        {isLoading ? (
          <CourseListSkeleton />
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Error loading courses: {error.message}</p>
          </div>
        ) : (filteredCourses.length > 0 || filteredPathways.length > 0) ? (
          <>
            <div className="mb-4 flex items-center justify-between">

              {isFetching && <div className="text-sm text-gray-500">Loading...</div>}
            </div>


            {/* Pathways Section */}
            {filteredPathways.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Course Combos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredPathways.map((pathway) => (
                    <PathwayCard key={pathway._id} pathway={pathway} />
                  ))}
                </div>
                <div className="border-b border-gray-200 mt-8"></div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard key={course._id} course={course} />
                ))}
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev || isFetching}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={!pagination.hasNext || isFetching}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No courses found</p>
            {debouncedSearch && (
              <button
                onClick={() => navigate('/course-list')}
                className="mt-4 text-blue-600 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default CourseList
