import { useContext } from 'react';
import { AppContext } from '../../context/AppContext.jsx';
import CourseCard from '../../components/students/CourseCard';
import PathwayCard from '../../components/students/PathwayCard';
import { Link } from 'react-router-dom';

const Favorites = () => {
  const { allCourses, favoriteCourses, allPathways, favoritePathways } = useContext(AppContext);
  const favoriteList = allCourses.filter(course => favoriteCourses.includes(course._id));
  const favoritePathwayList = allPathways ? allPathways.filter(pathway => favoritePathways && favoritePathways.includes(pathway._id)) : [];

  return (
    <>
      <div className="bg-gradient-to-b from-cyan-100/70 to-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">My Favorite Courses</h1>
          <p className="text-gray-600">Courses you've marked as favorites</p>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50 -mt-4">
        <div className="max-w-7xl mx-auto py-10 px-4">

          {(favoriteList.length === 0 && favoritePathwayList.length === 0) ? (
            <div className="text-center py-16">
              <div className="mb-6">
                <svg className="mx-auto h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">No favorite courses yet</h3>
              <p className="text-gray-500 mb-6">Start browsing courses and mark the ones you like as favorites!</p>
              <Link
                to="/course-list"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-gray-600">
                  {favoriteList.length + favoritePathwayList.length} item{(favoriteList.length + favoritePathwayList.length) !== 1 ? 's' : ''} in your favorites
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favoriteList.map(course => (
                  <CourseCard key={course._id} course={course} />
                ))}
                {favoritePathwayList.map(pathway => (
                  <PathwayCard key={pathway._id} pathway={pathway} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Favorites;
