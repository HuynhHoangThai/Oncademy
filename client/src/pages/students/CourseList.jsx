
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import SearchBar from '../../components/students/SearchBar'
import CourseCard from '../../components/students/CourseCard'
import { assets } from '../../assets/assets'
import Footer from '../../components/students/Footer'
import { useCourses } from '../../hooks/useCourses'
import { CourseListSkeleton } from '../../components/students/SkeletonLoader'
import { useDebounce } from '../../hooks/useDebounce'

const CourseList = () => {
  const { input } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })
  const [actualPriceRange, setActualPriceRange] = useState({ min: 0, max: 1000 })
  const [showPriceFilter, setShowPriceFilter] = useState(false)
  
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

  // Calculate price range from all courses (need to fetch all for this)
  useEffect(() => {
    if (courses.length > 0) {
      const prices = courses.map(course => 
        course.coursePrice - (course.discount * course.coursePrice / 100)
      )
      const minPrice = Math.floor(Math.min(...prices, actualPriceRange.min || 0))
      const maxPrice = Math.ceil(Math.max(...prices, actualPriceRange.max || 1000))
      
      if (minPrice !== actualPriceRange.min || maxPrice !== actualPriceRange.max) {
        setActualPriceRange({ min: minPrice, max: maxPrice })
        if (priceRange.min === 0 && priceRange.max === 1000) {
          setPriceRange({ min: minPrice, max: maxPrice })
        }
      }
    }
  }, [courses])

  // Filter courses by price range (client-side)
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const finalPrice = course.coursePrice - (course.discount * course.coursePrice / 100)
      return finalPrice >= priceRange.min && finalPrice <= priceRange.max
    })
  }, [courses, priceRange])

  // Reset page when search changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])
  
  
  return (
    <>
    <div className="relative md:px-36 px-8 pt-20 text-left bg-gradient-to-b from-cyan-100/70 pb-8">
      <div className='flex md:flex-row flex-col gap-6 items-start justify-between w-full'>
        <div>
           <h1 className='text-4xl font-semibold text-gray-800'>Course List</h1>
            <p className='text-gray-500'>
          <span className='text-blue-600 cursor-pointer'
          onClick={()=>navigate('/')}>Home</span> / <span>Course List </span></p>
        </div>
       <SearchBar data={input}/>
      </div>
        {input && <div className='inline-flex items-center gap-4 px-4 py-2 border mt-8 -mb-8 text-gray-600 bg-white rounded-lg shadow-sm'>
                    <p>{input}</p>
                    <img onClick={() => navigate('/course-list')} className='cursor-pointer' src={assets.cross_icon} alt="" />
                </div>}
    </div>
    
    <div className="relative md:px-36 px-8 -mt-4">
      {/* Price Filter - Dynamic Range */}
      <div className="mt-8 mb-4">
        <button 
          onClick={() => setShowPriceFilter(!showPriceFilter)}
          className="flex items-center justify-between w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
            </svg>
            <span>Price Filter</span>
            {(priceRange.min !== actualPriceRange.min || priceRange.max !== actualPriceRange.max) && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                ${priceRange.min} - ${priceRange.max}
              </span>
            )}
          </div>
          <img 
            src={assets.dropdown_icon} 
            alt="" 
            className={`w-4 h-4 transition-transform duration-200 ${showPriceFilter ? 'rotate-180' : ''}`}
          />
        </button>
        
        {showPriceFilter && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
            {/* Price Range Info */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-gray-800">Price Range</h3>
                <p className="text-sm text-gray-500">
                  Available: ${actualPriceRange.min} - ${actualPriceRange.max}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-600">
                  Selected: ${priceRange.min} - ${priceRange.max}
                </p>
                {courses.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {filteredCourses.length} courses found
                  </p>
                )}
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Quick Select:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPriceRange(actualPriceRange)}
                  className={`px-3 py-1 text-sm rounded-lg transition duration-200 ${
                    priceRange.min === actualPriceRange.min && priceRange.max === actualPriceRange.max
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Prices
                </button>
                <button
                  onClick={() => setPriceRange({ min: actualPriceRange.min, max: Math.ceil(actualPriceRange.max / 4) })}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition duration-200"
                >
                  Budget (${actualPriceRange.min} - ${Math.ceil(actualPriceRange.max / 4)})
                </button>
                <button
                  onClick={() => setPriceRange({ 
                    min: Math.ceil(actualPriceRange.max / 4), 
                    max: Math.ceil(actualPriceRange.max / 2) 
                  })}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition duration-200"
                >
                  Mid-range (${Math.ceil(actualPriceRange.max / 4)} - ${Math.ceil(actualPriceRange.max / 2)})
                </button>
                <button
                  onClick={() => setPriceRange({ 
                    min: Math.ceil(actualPriceRange.max / 2), 
                    max: actualPriceRange.max 
                  })}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition duration-200"
                >
                  Premium (${Math.ceil(actualPriceRange.max / 2)}+)
                </button>
              </div>
            </div>

            {/* Custom Range Inputs */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Min: $</label>
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({
                    ...priceRange, 
                    min: Math.max(actualPriceRange.min, Math.min(Number(e.target.value), priceRange.max))
                  })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={actualPriceRange.min}
                  max={priceRange.max}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Max: $</label>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({
                    ...priceRange, 
                    max: Math.min(actualPriceRange.max, Math.max(Number(e.target.value), priceRange.min))
                  })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={priceRange.min}
                  max={actualPriceRange.max}
                />
              </div>
              <button
                onClick={() => setPriceRange(actualPriceRange)}
                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition duration-200"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="mt-8">
        {isLoading ? (
          <CourseListSkeleton />
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Error loading courses: {error.message}</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredCourses.length} of {pagination?.total || 0} courses
                {debouncedSearch && <span> for "{debouncedSearch}"</span>}
              </div>
              {isFetching && <div className="text-sm text-gray-500">Loading...</div>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
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
      
    </div>
    <Footer />
    </>
  )
}

export default CourseList
