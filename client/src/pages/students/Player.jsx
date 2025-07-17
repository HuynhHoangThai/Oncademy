import { useContext, useEffect, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import { useParams } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { useState } from 'react';
import humanizeDuration from 'humanize-duration';
import YouTube from 'react-youtube';
import Footer from '../../components/students/Footer';
import Rating from '../../components/students/Rating';

const Player = () => {
  const {enrolledCourses, calculateChapterTime, addCourseRating, getUserRatingForCourse, toggleFavoriteCourse, isCourseFavorite}= useContext(AppContext);
  const {courseId}=useParams();
  const [courseData,setCourseData]=useState(null);
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [completedLectures, setCompletedLectures] = useState(new Set());
  
  const getCourseData = useCallback(() => {
    enrolledCourses.map((course)=>{
      if(course._id === courseId) {
        setCourseData(course);
      }
    })
  }, [enrolledCourses, courseId])
  useEffect(() => {
    getCourseData();

  },[getCourseData])
    const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
  const getAllLectures = () => {
    if (!courseData) return [];
    let allLectures = [];
    courseData.courseContent.forEach((chapter, chapterIndex) => {
      chapter.chapterContent.forEach((lecture, lectureIndex) => {
        allLectures.push({
          ...lecture,
          chapter: chapterIndex + 1,
          lecture: lectureIndex + 1,
          chapterIndex,
          lectureIndex
        });
      });
    });
    return allLectures;
  };
  const goToPrevious = () => {
    const allLectures = getAllLectures();
    const currentIndex = allLectures.findIndex(
      lecture => lecture.chapter === playerData.chapter && lecture.lecture === playerData.lecture
    );
    if (currentIndex > 0) {
      setPlayerData(allLectures[currentIndex - 1]);
    }
  };
  const goToNext = () => {
    const allLectures = getAllLectures();
    const currentIndex = allLectures.findIndex(
      lecture => lecture.chapter === playerData.chapter && lecture.lecture === playerData.lecture
    );
    if (currentIndex < allLectures.length - 1) {
      setPlayerData(allLectures[currentIndex + 1]);
    }
  };
  const markLectureComplete = () => {
    if (playerData) {
      const lectureKey = `${playerData.chapter}-${playerData.lecture}`;
      setCompletedLectures(prev => new Set([...prev, lectureKey]));
    }
  };
  const isLectureCompleted = (chapterNum, lectureNum) => {
    const lectureKey = `${chapterNum}-${lectureNum}`;
    return completedLectures.has(lectureKey);
  };

  const handleCourseRating = (rating) => {
    if (courseData) {
      addCourseRating(courseData._id, rating);
    }
  };
  return (
    <>
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <div className='p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 xl:px-48 lg:px-24 md:px-16 max-w-7xl mx-auto'>
          {/*LEFT SIDE*/}
          <div className='text-gray-800 flex-1'>
            <h2 className='xl:text-4xl lg:text-3xl md:text-2xl text-xl font-semibold mb-6'>{courseData ? courseData.courseTitle : 'Course Name'}</h2>
        <div className='pt-5'>
                      {courseData && courseData.courseContent.map((chapter, index)=>(
                        <div key={index} className="border border-gray-300 bg-white mb-2 rounded">
                          <div  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none" onClick={() => toggleSection(index)}>
                            <div className="flex items-center gap-2">
                              <img className={`transform transition-transform ${openSections[index] ? "rotate-180" : ""}`} src={assets.down_arrow_icon} alt="arrow icon" />
                              <p className="font-medium md:text-base text-sm">{chapter.chapterTitle}</p>
                            </div>
                            <p className="text-sm md:text-default">{chapter.chapterContent.length} lectures - {calculateChapterTime(chapter)}</p>
                          </div>
                          <div className={`overflow-hidden transition-all duration-300 ${openSections[index] ? "max-h-96" : "max-h-0"}`}>
                            <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                              {chapter.chapterContent.map((lecture, i) => (
                                <li key={i} className="flex items-start gap-2 py-1">
                                  <img src={isLectureCompleted(index + 1, i + 1) ? assets.blue_tick_icon : assets.play_icon } alt="bullet icon" className="w-4 h-4 mt-1" />
                                  <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                                    <p className={isLectureCompleted(index + 1, i + 1) ? 'text-gray-500' : ''}>{lecture.lectureTitle}</p>
                                    <div className='flex gap-2'>
                                      {lecture.lectureUrl && <p onClick={() => setPlayerData({
                                        ...lecture,chapter:index+1,lecture: i+1
                                      })} className='text-blue-500 cursor-pointer'>Watch</p>}
                                      <p>{humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ['h', 'm'] })}</p>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
          <div className="flex items-center gap-4 py-4 mt-10 bg-gray-50 p-4 rounded-lg">
            <h1 className="lg:text-xl md:text-lg text-base font-bold text-gray-800">Rate this course:</h1>
            <Rating 
              initialRating={courseData ? getUserRatingForCourse(courseData._id) : 0} 
              onRate={handleCourseRating}
            />
            {courseData && getUserRatingForCourse(courseData._id) > 0 && (
              <span className="text-sm text-gray-600">
                You rated: {getUserRatingForCourse(courseData._id)}/5 stars
              </span>
            )}
            {courseData && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFavoriteCourse(courseData._id)}
                  className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center shadow-sm
                    ${isCourseFavorite(courseData._id) 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-red-500'
                    }`}
                  title={isCourseFavorite(courseData._id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <svg
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24"
                    fill={isCourseFavorite(courseData._id) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={isCourseFavorite(courseData._id) ? "0" : "2"}
                  >
                    <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>
                {isCourseFavorite(courseData._id) && (
                  <span className="text-sm text-red-600 font-medium">Favorited</span>
                )}
              </div>
            )}
          </div>
          </div>
          {/*RIGHT SIDE*/}
          <div className="flex-shrink-0 md:sticky md:top-10">
            <div className="xl:min-w-[480px] lg:min-w-[420px] md:min-w-[380px] min-w-[300px]">
              {playerData? (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <YouTube videoId={playerData.lectureUrl.split('/').pop()}  iframeClassName='w-full aspect-video'/>
                  <div className='p-6'>
                    <h3 className='text-xl font-semibold mb-2'>{playerData.lectureTitle}</h3>
                    <p className='text-sm text-gray-600 mb-6'>Chapter {playerData.chapter}, Lecture {playerData.lecture}</p>
                    <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4'>
                      <div className='flex gap-3'>
                        <button 
                          onClick={goToPrevious}
                          disabled={!playerData || getAllLectures().findIndex(
                            lecture => lecture.chapter === playerData.chapter && lecture.lecture === playerData.lecture
                          ) === 0}
                          className='bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors'
                        >
                          Previous
                        </button>
                        <button 
                          onClick={goToNext}
                          disabled={!playerData || getAllLectures().findIndex(
                            lecture => lecture.chapter === playerData.chapter && lecture.lecture === playerData.lecture
                          ) === getAllLectures().length - 1}
                          className='bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors'
                        >
                          Next
                        </button>
                      </div>
                      <button 
                        onClick={markLectureComplete}
                        disabled={isLectureCompleted(playerData.chapter, playerData.lecture)}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                          isLectureCompleted(playerData.chapter, playerData.lecture) 
                            ? 'bg-green-600 text-white cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <img src={assets.blue_tick_icon} alt="check" className="w-4 h-4" />
                        {isLectureCompleted(playerData.chapter, playerData.lecture) ? 'Completed' : 'Mark Complete'}
                      </button>
                    </div>
                  </div>
                </div>
              ):(
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <img src={courseData ? courseData.courseThumbnail : ''} alt="" className='w-full aspect-video object-cover' />
                  <div className="p-6">
                    <p className="text-gray-500 text-center">Select a lecture to start watching</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
    </>
  )
}

export default Player
