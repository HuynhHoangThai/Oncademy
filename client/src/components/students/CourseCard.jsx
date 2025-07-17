import { useContext, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'

const CourseCard = ({course}) => {
  const {currency, calculateRating, ratingUpdateTrigger, getTotalReviewCount, toggleFavoriteCourse, isCourseFavorite, addToViewHistory} = useContext(AppContext);
  
  // Calculate rating dynamically on each render
  const rating = calculateRating(course);
  const reviewCount = getTotalReviewCount(course);
  
  // This effect will cause component to re-render when rating changes
  useEffect(() => {
    // Component will re-render when ratingUpdateTrigger changes
  }, [ratingUpdateTrigger]);
  
  return (
    <div className="relative bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden">
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavoriteCourse(course._id);
          }}
          className={`absolute top-3 right-3 z-10 p-1.5 rounded-full transition-all duration-200 shadow-sm
            ${isCourseFavorite(course._id) 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
            }`}
          title={isCourseFavorite(course._id) ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg
            width="18" 
            height="18" 
            viewBox="0 0 24 24"
            fill={isCourseFavorite(course._id) ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={isCourseFavorite(course._id) ? "0" : "2"}
          >
            <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
        <Link to={'/course/' + course._id} onClick={() => {
          scrollTo(0, 0);
          addToViewHistory(course._id);
        }} className="block">
        <img className="w-full h-48 object-cover" src={course.courseThumbnail} alt={course.courseTitle} />
        <div className="p-4 text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">{course.courseTitle}</h3>
          <p className="text-sm text-gray-600 mb-3">{course.educator.name}</p>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm font-medium text-gray-700">{rating}</p>
            <div className='flex'>
               {[1,2,3,4,5].map((star) => (
                            <img
                                key={star}
                                src={assets.star}
                                alt=""
                                className={`w-3.5 h-3.5 ${star <= rating ? 'opacity-100' : 'opacity-30'}`}
                            />
                        ))}
            </div>
            <p className='text-sm text-gray-500'>({reviewCount})</p>
          </div>
          <p className='text-lg font-semibold text-gray-800'>{currency}{(course.coursePrice - course.discount * course.coursePrice/100).toFixed(2)}</p>
        </div>
        </Link>
    </div>
)
}

export default CourseCard
