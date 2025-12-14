import { AppContext } from '../../context/AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useContext } from 'react';
import Loading from '../../components/students/Loading';
import { assets } from '../../assets/assets';
import humanizeDuration from 'humanize-duration'
import Footer from '../../components/students/Footer';
import YouTube from 'react-youtube';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import { useCourse } from '../../hooks/useCourses';

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [playerInstance, setPlayerInstance] = useState(null);
  const [previewInterval, setPreviewInterval] = useState(null);
  const { currency } = useContext(AppContext);
  const [_isAlreadyEnrolled, _setIsAlreadyEnrolled] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { getToken } = useAuth();
  const { user } = useUser();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;


  const { calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
    calculateRating,
    getTotalReviewCount,

    toggleFavoriteCourse,
    isCourseFavorite,
    addToViewHistory } = useContext(AppContext);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;

    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  };

  // Fetch course data using React Query
  const { data: courseResponse, isLoading: courseLoading } = useCourse(id);

  useEffect(() => {
    if (courseResponse?.courseData) {
      setCourseData(courseResponse.courseData);
      if (id) {
        addToViewHistory(id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseResponse, id]);

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Handle YouTube player ready
  const onPlayerReady = (event) => {
    const player = event.target;
    setPlayerInstance(player);
  };

  // Handle YouTube player state change
  const onPlayerStateChange = (event) => {
    if (!playerInstance) return;

    // Clear any existing interval
    if (previewInterval) {
      clearInterval(previewInterval);
      setPreviewInterval(null);
    }

    if (event.data === window.YT.PlayerState.PLAYING) {
      // Force video to start from beginning for preview
      const currentTime = playerInstance.getCurrentTime();
      if (currentTime > 60) {
        playerInstance.seekTo(0, true);
      }

      // Check time every 500ms for smoother control
      const interval = setInterval(() => {
        const time = playerInstance.getCurrentTime();

        // If user tries to seek beyond 60 seconds, force back to start
        if (time > 60) {
          playerInstance.pauseVideo();
          playerInstance.seekTo(0, true);
          clearInterval(interval);
          setPreviewInterval(null);

          // Show attractive modal-style toast
          toast.warning(
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Preview Time Ended</p>
                <p className="text-sm text-gray-600 mt-1">Enroll now to unlock full access to this course and all its content!</p>
              </div>
            </div>,
            {
              autoClose: 6000,
              closeButton: true,
              position: 'top-center',
              style: {
                minWidth: '400px'
              }
            }
          );
        }
      }, 500);

      setPreviewInterval(interval);
    } else if (event.data === window.YT.PlayerState.PAUSED ||
      event.data === window.YT.PlayerState.ENDED) {
      if (previewInterval) {
        clearInterval(previewInterval);
        setPreviewInterval(null);
      }
    }
  };

  // Cleanup interval when component unmounts or player changes
  useEffect(() => {
    return () => {
      if (previewInterval) {
        clearInterval(previewInterval);
      }
    };
  }, [previewInterval]);

  const handleEnrollNow = async () => {
    try {
      if (!user) {
        toast.error('Please sign in to enroll in this course');
        return;
      }

      setIsPurchasing(true);

      const token = await getToken();

      const { data } = await axios.post(
        `${backendUrl}/api/user/purchase`,
        { courseId: courseData._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success && data.sessionUrl) {
        // Redirect to Stripe checkout page
        window.location.href = data.sessionUrl;
      } else {
        // Check if already enrolled
        if (data.alreadyEnrolled) {
          toast.info(data.message || 'You are already enrolled in this course');
          // Optionally redirect to My Enrollments
          setTimeout(() => {
            navigate('/my-enrollments');
          }, 2000);
        } else {
          toast.error(data.message || 'Failed to create checkout session');
        }
        setIsPurchasing(false);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(error?.response?.data?.message || error.message || 'Failed to start checkout');
      setIsPurchasing(false);
    }
  };

  if (courseLoading) return <Loading />;
  if (!courseData) return <Loading />;

  return (
    <>
      <div className="flex md:flex-row flex-col-reverse gap-8 md:gap-12 relative items-start justify-center md:px-36 px-8 md:pt-20 pt-10 text-left bg-gradient-to-b from-cyan-100/40 to-white pb-12">
        {/*left*/}
        <div className="flex-1 max-w-2xl text-black">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 flex-1">{courseData.courseTitle}</h1>
            <button
              onClick={() => toggleFavoriteCourse(courseData._id)}
              className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center shadow-sm flex-shrink-0
                ${isCourseFavorite(courseData._id)
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-red-500'
                }`}
              title={isCourseFavorite(courseData._id) ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={isCourseFavorite(courseData._id) ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={isCourseFavorite(courseData._id) ? "0" : "2"}
              >
                <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          </div>
          <p className='pt-2 md:text-base text-sm text-gray-600 leading-relaxed' dangerouslySetInnerHTML={{ __html: courseData.courseDescription?.slice(0, 200) || '' }}></p>

          {/*reviews*/}
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`w-5 h-5 fill-current ${star <= calculateRating(courseData) ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-lg font-semibold text-gray-800">{calculateRating(courseData)}</span>
              <span className="text-gray-600">({getTotalReviewCount(courseData)} reviews)</span>
            </div>
          </div>
          <div className='pt-8 text-gray-800'>
            <h2 className='text-xl font-semibold'>Course Structure</h2>
            <div className='pt-5'>
              {Array.isArray(courseData.courseContent) && courseData.courseContent.map((chapter, index) => (
                <div key={index} className="border border-gray-300 bg-white mb-2 rounded">
                  <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none" onClick={() => toggleSection(index)}>
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
                          <img src={assets.play_icon} alt="bullet icon" className="w-4 h-4 mt-1" />
                          <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                            <p>{lecture.lectureTitle}</p>
                            <div className='flex gap-2'>
                              {lecture.isPreviewFree && <p onClick={() => setPlayerData({
                                videoId: getYouTubeVideoId(lecture.lectureUrl)
                              })} className='text-blue-500 cursor-pointer'>Preview</p>}
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
          </div>
          <div className="py-16 text-sm md:text-default">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Course Description</h3>
            <div className="rich-text prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: courseData.courseDescription || '' }}>
            </div>
          </div>
        </div>
        {/*right*/}
        <div className="flex-shrink-0 md:sticky md:top-10">
          <div className="w-full max-w-sm mx-auto">
            {/* Video/Image Container */}
            <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
              {playerData && playerData.videoId ? (
                <div className="relative">
                  <YouTube
                    videoId={playerData.videoId}
                    onReady={onPlayerReady}
                    onStateChange={onPlayerStateChange}
                    opts={{
                      playerVars: {
                        autoplay: 1,
                        modestbranding: 1,
                        rel: 0,
                        start: 0,
                        controls: 1,
                        disablekb: 1,
                        fs: 0,
                        iv_load_policy: 3
                      }
                    }}
                    iframeClassName='w-full aspect-video'
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <div className="flex items-center justify-between text-white text-sm">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Preview Mode
                      </span>
                      <button
                        onClick={() => setPlayerData(null)}
                        className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={courseData.courseThumbnail}
                  alt={courseData.courseTitle}
                  className="w-full aspect-video object-cover"
                  loading="lazy"
                />
              )}

              {/* Price Alert */}
              <div className="flex items-center gap-2 p-3 bg-red-50 border-t">
                <img className="w-4 h-4" src={assets.time_left_clock_icon} alt="time left clock icon" />
                <p className="text-red-600 text-sm font-medium">
                  5 days left at this price!
                </p>
              </div>
            </div>

            {/* Course Info Card */}
            <div className="bg-white rounded-lg shadow-lg p-5 mt-3">
              {/* Price Section */}
              <div className="flex items-center gap-2 mb-4">
                <p className="text-gray-800 text-xl md:text-2xl font-bold">
                  {currency}{(courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2)}
                </p>
                <p className="text-base text-gray-500 line-through">{currency}{courseData.coursePrice}</p>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                  {courseData.discount}% off
                </span>
              </div>

              {/* Course Stats */}
              <div className="flex items-center text-sm gap-3 mb-5 text-gray-600">
                <div className="flex items-center gap-1">
                  <img src={assets.star} alt="star icon" className="w-4 h-4" />
                  <span>{calculateRating(courseData)}</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center gap-1">
                  <img src={assets.time_clock_icon} alt="clock icon" className="w-4 h-4" />
                  <span>{calculateCourseDuration(courseData)}</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center gap-1">
                  <img src={assets.lesson_icon} alt="lessons icon" className="w-4 h-4" />
                  <span>{calculateNoOfLectures(courseData)} lessons</span>
                </div>
              </div>

              {/* Enroll Button */}
              <button
                onClick={handleEnrollNow}
                disabled={isPurchasing || _isAlreadyEnrolled}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors shadow-md ${isPurchasing
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : _isAlreadyEnrolled
                      ? 'bg-green-600 cursor-not-allowed text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                {isPurchasing ? 'Processing...' : _isAlreadyEnrolled ? 'Already Enrolled' : 'Enroll Now'}
              </button>

              {/* Course Features */}
              <div className="mt-5">
                <h3 className="text-base font-semibold text-gray-800 mb-3">What's included:</h3>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Full access to course content
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Learn at your own pace
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Access on mobile and desktop
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Certificate upon completion
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CourseDetailPage
