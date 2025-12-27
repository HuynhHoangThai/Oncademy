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

const PathwayDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [pathway, setPathway] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openPhases, setOpenPhases] = useState({});
    const [playerData, setPlayerData] = useState(null);
    const [playerInstance, setPlayerInstance] = useState(null);
    const [previewInterval, setPreviewInterval] = useState(null);
    const [enrolling, setEnrolling] = useState(false);
    const { currency, enrolledPathways } = useContext(AppContext);
    const { getToken, isSignedIn } = useAuth();
    const { user } = useUser();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Check if already enrolled
    const isAlreadyEnrolled = enrolledPathways?.some(p => p._id === id);

    // Fetch Pathway Data
    useEffect(() => {
        const fetchPathway = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/pathway/${id}`);
                if (data.success) {
                    setPathway(data.pathwayData);
                } else {
                    toast.error(data.message || 'Pathway not found');
                    navigate('/courses');
                }
            } catch (error) {
                console.error('Error fetching pathway:', error);
                toast.error('Failed to load pathway');
                navigate('/courses');
            } finally {
                setLoading(false);
            }
        };

        fetchPathway();
    }, [id, backendUrl, navigate]);

    // Extract YouTube video ID
    const getYouTubeVideoId = (url) => {
        if (!url) return null;
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /^([a-zA-Z0-9_-]{11})$/
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) return match[1];
        }
        return null;
    };

    const togglePhase = (index) => {
        setOpenPhases((prev) => ({
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

    const handleEnroll = async () => {
        if (!isSignedIn) {
            toast.info('Please sign in to enroll');
            return;
        }

        setEnrolling(true);
        try {
            const token = await getToken();
            const { data } = await axios.post(`${backendUrl}/api/pathway/purchase`,
                { pathwayId: pathway._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                window.location.href = data.sessionUrl;
            } else {
                toast.error(data.message || 'Failed to create checkout session');
                setEnrolling(false);
            }
        } catch (error) {
            console.error('Enrollment error:', error);
            toast.error('Failed to enroll in pathway');
            setEnrolling(false);
        }
    };

    // Helper calculations
    const calculateRating = (p) => {
        if (!p?.courseRatings || p.courseRatings.length === 0) return 0;
        return (p.courseRatings.reduce((sum, r) => sum + r.rating, 0) / p.courseRatings.length).toFixed(1);
    };

    const calculateTotalLectures = (p) => {
        let total = 0;
        p?.phases?.forEach(phase => {
            phase.chapters?.forEach(chapter => {
                total += chapter.chapterContent?.length || 0;
            });
        });
        return total;
    };

    const calculateTotalDuration = (p) => {
        let totalMinutes = 0;
        p?.phases?.forEach(phase => {
            phase.chapters?.forEach(chapter => {
                chapter.chapterContent?.forEach(lecture => {
                    totalMinutes += lecture.lectureDuration || 0;
                });
            });
        });
        return humanizeDuration(totalMinutes * 60 * 1000, { units: ['h', 'm'] });
    };

    const calculatePhaseLectures = (phase) => {
        let total = 0;
        phase.chapters?.forEach(ch => total += ch.chapterContent?.length || 0);
        return total;
    }
    const calculatePhaseDuration = (phase) => {
        let mins = 0;
        phase.chapters?.forEach(ch => {
            ch.chapterContent?.forEach(l => mins += l.lectureDuration || 0);
        });
        return humanizeDuration(mins * 60 * 1000, { units: ['h', 'm'] });
    }


    if (loading) return <Loading />;
    if (!pathway) return <Loading />;

    return (
        <>
            <div className="flex md:flex-row flex-col-reverse gap-8 md:gap-12 relative items-start justify-center md:px-36 px-8 md:pt-20 pt-10 text-left bg-gradient-to-b from-cyan-100/40 to-white pb-12">
                {/* Left Column - Content */}
                <div className="flex-1 max-w-2xl text-black">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 flex-1">
                            {pathway.pathwayTitle}
                        </h1>
                        {/* Optional: Add Favorite button here later if supported */}
                    </div>

                    {/* Educator Info (Optional styling kept minimal) */}
                    {pathway.educator && (
                        <div className="flex items-center gap-2 mb-4 text-gray-600">
                            <span className="text-sm font-medium">Created by {pathway.educator.name}</span>
                        </div>
                    )}



                    {/* Reviews Section */}
                    <div className="mt-6">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg key={star} className={`w-5 h-5 fill-current ${star <= calculateRating(pathway) ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <span className="text-lg font-semibold text-gray-800">{calculateRating(pathway)}</span>
                            <span className="text-gray-600">({pathway.courseRatings?.length || 0} reviews)</span>
                        </div>
                    </div>

                    <div className='pt-8 text-gray-800'>
                        <h2 className='text-xl font-semibold'>Pathway Syllabus</h2>
                        <div className='pt-5'>
                            {pathway.phases?.map((phase, index) => (
                                <div key={index} className="border border-gray-300 bg-white mb-2 rounded">
                                    <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none" onClick={() => togglePhase(index)}>
                                        <div className="flex items-center gap-2">
                                            <img className={`transform transition-transform ${openPhases[index] ? "rotate-180" : ""}`} src={assets.down_arrow_icon} alt="arrow icon" />
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
                                                        Phase {index + 1}
                                                    </span>
                                                    <p className="font-medium md:text-base text-sm">{phase.phaseTitle}</p>
                                                </div>
                                                <p className="text-xs text-gray-500">{phase.chapters?.length} Chapters</p>
                                            </div>
                                        </div>
                                        <p className="text-sm md:text-default hidden sm:block">
                                            {calculatePhaseLectures(phase)} lectures - {calculatePhaseDuration(phase)}
                                        </p>
                                    </div>

                                    <div className={`overflow-hidden transition-all duration-300 ${openPhases[index] ? "max-h-[800px] overflow-y-auto" : "max-h-0"}`}>
                                        <div className="px-4 pb-4 border-t border-gray-300 bg-gray-50">
                                            {/* Iterate Chapters inside Phase */}
                                            {phase.chapters?.map((chapter, cIndex) => (
                                                <div key={cIndex} className="mt-4">
                                                    <h4 className="font-semibold text-sm text-gray-700 mb-2">{chapter.chapterTitle}</h4>
                                                    <ul className="list-disc pl-5 space-y-1">
                                                        {chapter.chapterContent?.map((lecture, lIndex) => (
                                                            <li key={lIndex} className="flex items-start gap-2 py-1">
                                                                <img src={assets.play_icon} alt="bullet icon" className="w-3 h-3 mt-1.5 opacity-60" />
                                                                <div className="flex items-center justify-between w-full text-gray-600 text-xs md:text-sm">
                                                                    <p>{lecture.lectureTitle}</p>
                                                                    <div className='flex gap-2 flex-shrink-0'>
                                                                        {lecture.isPreviewFree && <p onClick={() => setPlayerData({
                                                                            videoId: getYouTubeVideoId(lecture.lectureUrl)
                                                                        })} className='text-blue-500 cursor-pointer font-medium hover:text-blue-700'>Preview</p>}
                                                                        <p>{humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ['m'] })}</p>
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="py-16 text-sm md:text-default">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Pathway Description</h3>
                        <div className="rich-text prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: pathway.pathwayDescription || '' }}>
                        </div>
                    </div>
                </div>

                {/* Right Column - Sidebar */}
                <div className="flex-shrink-0 md:static md:top-10">
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
                                    src={pathway.pathwayThumbnail}
                                    alt={pathway.pathwayTitle}
                                    className="w-full aspect-video object-cover"
                                    loading="lazy"
                                />
                            )}
                        </div>

                        {/* Info Card */}
                        <div className="bg-white rounded-lg shadow-lg p-5 mt-3">
                            {/* Price Section */}
                            <div className="flex items-center gap-2 mb-4">
                                <p className="text-gray-800 text-xl md:text-2xl font-bold">
                                    {currency}{(pathway.pathwayPrice - pathway.discount * pathway.pathwayPrice / 100).toFixed(2)}
                                </p>
                                <p className="text-base text-gray-500 line-through">{currency}{pathway.pathwayPrice}</p>
                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                                    {pathway.discount}% off
                                </span>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center text-sm gap-3 mb-5 text-gray-600 flex-wrap">
                                <div className="flex items-center gap-1">
                                    <img src={assets.star} alt="star icon" className="w-4 h-4" />
                                    <span>{calculateRating(pathway)}</span>
                                </div>
                                <div className="h-4 w-px bg-gray-300"></div>
                                <div className="flex items-center gap-1">
                                    <img src={assets.time_clock_icon} alt="clock icon" className="w-4 h-4" />
                                    <span>{calculateTotalDuration(pathway)}</span>
                                </div>
                                <div className="h-4 w-px bg-gray-300"></div>
                                <div className="flex items-center gap-1">
                                    <img src={assets.lesson_icon} alt="lessons icon" className="w-4 h-4" />
                                    <span>{calculateTotalLectures(pathway)} lessons</span>
                                </div>
                            </div>

                            {/* Enroll Button */}
                            <button
                                onClick={handleEnroll}
                                disabled={enrolling || isAlreadyEnrolled}
                                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors shadow-md ${enrolling
                                    ? 'bg-gray-400 cursor-not-allowed text-white'
                                    : isAlreadyEnrolled
                                        ? 'bg-green-600 cursor-not-allowed text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {enrolling ? 'Processing...' : isAlreadyEnrolled ? 'Already Enrolled' : 'Enroll Now'}
                            </button>

                            {/* Features */}
                            <div className="mt-5">
                                <h3 className="text-base font-semibold text-gray-800 ">What's included:</h3>
                                <ul className="space-y-1.5 text-sm text-gray-600">
                                    {pathway.phases?.map((phase, i) => (
                                        <li key={i} className="flex items-center gap-2">


                                        </li>
                                    ))}
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

export default PathwayDetailPage;
