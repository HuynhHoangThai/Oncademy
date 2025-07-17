
import {useContext } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import SearchBar from '../../components/students/SearchBar'
import CourseCard from '../../components/students/CourseCard'
import { useState, useEffect } from 'react'
import { assets } from '../../assets/assets'
import Footer from '../../components/students/Footer'
const CourseList = () => {
  const { allCourses } = useContext(AppContext)
  const { input } = useParams()
  const navigate = useNavigate()
  const [filteredCourse, setFilteredCourse] = useState([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200 })
  const [showPriceFilter, setShowPriceFilter] = useState(false)
  
  useEffect(() => {
     if (allCourses && allCourses.length > 0) {
            let tempCourses = allCourses.slice()

            // Filter by search input
            if (input) {
                tempCourses = tempCourses.filter(
                    item => item.courseTitle.toLowerCase().includes(input.toLowerCase())
                )
            }

            // Filter by price range
            tempCourses = tempCourses.filter(course => {
                const finalPrice = course.coursePrice - (course.discount * course.coursePrice / 100)
                return finalPrice >= priceRange.min && finalPrice <= priceRange.max
            })

            setFilteredCourse(tempCourses)
        }
  },[allCourses, input, priceRange])
  
  
  return (
    <>
    <div className="relative md:px-36 px-8 pt-20 text-left">
      <div className='flex md:flex-row flex-col gap-6 items-start justify-between w-full'>
        <div>
           <h1 className='text-4xl font-semibold text-gray-800'>Course List</h1>
            <p className='text-gray-500'>
          <span className='text-blue-600 cursor-pointer'
          onClick={()=>navigate('/')}>Home</span> / <span>Course List </span></p>
        </div>
       <SearchBar data={input}/>
      </div>
        {input && <div className='inline-flex items-center gap-4 px-4 py-2 border mt-8 -mb-8 text-gray-600'>
                    <p>{input}</p>
                    <img onClick={() => navigate('/course-list')} className='cursor-pointer' src={assets.cross_icon} alt="" />
                </div>}
      
      {/* Price Filter */}
      <div className="mt-8 mb-4">
        <button 
          onClick={() => setShowPriceFilter(!showPriceFilter)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
        >
          <span>Price Filter</span>
          <img 
            src={assets.dropdown_icon} 
            alt="" 
            className={`w-4 h-4 transition-transform duration-200 ${showPriceFilter ? 'rotate-180' : ''}`}
          />
        </button>
        
        {showPriceFilter && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Min: $</label>
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({...priceRange, min: Number(e.target.value)})}
                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Max: $</label>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({...priceRange, max: Number(e.target.value)})}
                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <button
                onClick={() => setPriceRange({ min: 0, max: 200 })}
                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition duration-200"
              >
                Reset
              </button>
            </div>
            <div className="text-xs text-gray-500">
              Showing courses between ${priceRange.min} - ${priceRange.max}
            </div>
          </div>
        )}
      </div>
      <div className="mt-8">
        {allCourses && allCourses.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredCourse.length} of {allCourses.length} courses
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourse.map((course, index) => <CourseCard key={index} course={course} />)}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No courses available</p>
          </div>
        )}
      </div>
      
    </div>
    <Footer />
    </>
  )
}

export default CourseList
