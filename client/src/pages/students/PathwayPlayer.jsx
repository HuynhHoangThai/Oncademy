import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';
import humanizeDuration from 'humanize-duration';
import YouTube from 'react-youtube';
import Footer from '../../components/students/Footer';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import Loading from '../../components/students/Loading';
import Rating from '../../components/students/Rating';

const PathwayPlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getToken: getClerkToken, userId } = useAuth(); // Get userId directly from useAuth for rating check
    const {
        backendUrl,
        getToken,
        userData,
        addPathwayRating,
        toggleFavoritePathway,
        isPathwayFavorite,
        enrolledPathways
    } = useContext(AppContext);

    const [pathway, setPathway] = useState(null);
    const [loading, setLoading] = useState(true);
    const [playerData, setPlayerData] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [quizzesExpanded, setQuizzesExpanded] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [documentsExpanded, setDocumentsExpanded] = useState(false);

    // Manage expanded states
    const [expandedPhases, setExpandedPhases] = useState(new Set([0]));
    const [expandedChapters, setExpandedChapters] = useState(new Set());
    const [completedLectures, setCompletedLectures] = useState(new Set());
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);

    // Fetch Documents for Pathway
    const fetchDocuments = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(`${backendUrl}/api/pathway/${id}/documents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setDocuments(data.documents || []);
            }
        } catch (error) {
            console.error('Fetch documents error:', error);
            setDocuments([]);
        }
    };

    // Fetch Quizzes for Pathway
    const fetchQuizzes = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/quiz/pathway/${id}/published`);
            if (data.success) {
                setQuizzes(data.quizzes || []);
            }
        } catch (error) {
            console.error('Fetch quizzes error:', error);
            setQuizzes([]);
        }
    };

    // Fetch Progress
    const fetchProgress = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.post(
                `${backendUrl}/api/user/get-pathway-progress`,
                { pathwayId: id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success && data.progressData) {
                setCompletedLectures(new Set(data.progressData.lectureCompleted || []));
            }
        } catch (error) {
            console.error('Fetch progress error', error);
        }
    };

    useEffect(() => {
        if (pathway) { // Only fetch progress after pathway is loaded or if we have ID. actually ID is enough.
            fetchProgress();
            fetchQuizzes();
            fetchDocuments();
        }
    }, [id, getToken, pathway]); // Added pathway dependency to ensure we fetch after initial load if needed, but ID is stable.

    useEffect(() => {
        const fetchPathway = async () => {
            // 1. Try to find in enrolled pathways (contains full data with URLs)
            if (enrolledPathways && enrolledPathways.length > 0) {
                const enrolled = enrolledPathways.find(p => p._id === id);
                if (enrolled) {
                    setPathway(enrolled);
                    setLoading(false);
                    // Initialize player if not set
                    if (!playerData && enrolled.phases?.length > 0) {
                        const firstPhase = enrolled.phases[0];
                        if (firstPhase.chapters?.length > 0) {
                            const firstChapter = firstPhase.chapters[0];
                            setExpandedChapters(new Set([`${0}-0`]));
                            if (firstChapter.chapterContent?.length > 0) {
                                setPlayerData({
                                    ...firstChapter.chapterContent[0],
                                    phaseIndex: 0,
                                    chapterIndex: 0,
                                    lectureIndex: 0
                                });
                            }
                        }
                    }
                    return;
                }
            }

            try {
                const token = await getToken();
                const { data } = await axios.get(`${backendUrl}/api/pathway/${id}`);

                if (data.success) {
                    setPathway(data.pathwayData);

                    // Set initial player data
                    if (data.pathwayData.phases?.length > 0) {
                        const firstPhase = data.pathwayData.phases[0];
                        if (firstPhase.chapters?.length > 0) {
                            const firstChapter = firstPhase.chapters[0];
                            setExpandedChapters(new Set([`${0}-0`]));
                            if (firstChapter.chapterContent?.length > 0) {
                                setPlayerData({
                                    ...firstChapter.chapterContent[0],
                                    phaseIndex: 0,
                                    chapterIndex: 0,
                                    lectureIndex: 0
                                });
                            }
                        }
                    }
                } else {
                    toast.error(data.message || 'Failed to load pathway');
                    navigate('/my-enrollments');
                }
            } catch (error) {
                console.error('Error fetching pathway:', error);
                toast.error('Failed to load pathway');
            } finally {
                setLoading(false);
            }
        };

        fetchPathway();
    }, [id, backendUrl, getToken, navigate, enrolledPathways]);


    // Helper to extract video ID
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
        const newExpanded = new Set(expandedPhases);
        if (newExpanded.has(index)) newExpanded.delete(index);
        else newExpanded.add(index);
        setExpandedPhases(newExpanded);
    };

    const toggleChapter = (phaseIndex, chapterIndex) => {
        const key = `${phaseIndex}-${chapterIndex}`;
        const newExpanded = new Set(expandedChapters);
        if (newExpanded.has(key)) newExpanded.delete(key);
        else newExpanded.add(key);
        setExpandedChapters(newExpanded);
    };

    const getAllLectures = () => {
        if (!pathway) return [];
        let allLectures = [];
        pathway.phases.forEach((phase, pIndex) => {
            phase.chapters.forEach((chapter, cIndex) => {
                chapter.chapterContent.forEach((lecture, lIndex) => {
                    allLectures.push({
                        ...lecture,
                        phaseIndex: pIndex,
                        chapterIndex: cIndex,
                        lectureIndex: lIndex,
                        phaseTitle: phase.phaseTitle,
                        chapterTitle: chapter.chapterTitle
                    });
                });
            });
        });
        return allLectures;
    };

    const goToPrevious = () => {
        const all = getAllLectures();
        const currentIdx = all.findIndex(l =>
            l.phaseIndex === playerData.phaseIndex &&
            l.chapterIndex === playerData.chapterIndex &&
            l.lectureIndex === playerData.lectureIndex
        );
        if (currentIdx > 0) {
            const prev = all[currentIdx - 1];
            setPlayerData(prev);
            setExpandedPhases(prevs => new Set([...prevs, prev.phaseIndex]));
            setExpandedChapters(prevs => new Set([...prevs, `${prev.phaseIndex}-${prev.chapterIndex}`]));
        }
    };

    const goToNext = () => {
        const all = getAllLectures();
        const currentIdx = all.findIndex(l =>
            l.phaseIndex === playerData.phaseIndex &&
            l.chapterIndex === playerData.chapterIndex &&
            l.lectureIndex === playerData.lectureIndex
        );
        if (currentIdx < all.length - 1) {
            const next = all[currentIdx + 1];
            setPlayerData(next);
            setExpandedPhases(prevs => new Set([...prevs, next.phaseIndex]));
            setExpandedChapters(prevs => new Set([...prevs, `${next.phaseIndex}-${next.chapterIndex}`]));
        }
    };

    const markLectureComplete = async () => {
        if (!playerData || !pathway) return;

        const lectureId = playerData.lectureId;
        // Optimistic
        setCompletedLectures(prev => new Set([...prev, lectureId]));
        setIsMarkingComplete(true);

        try {
            const token = await getToken();
            const { data } = await axios.post(
                `${backendUrl}/api/user/update-pathway-progress`,
                { pathwayId: id, lectureId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success('Lecture completed!');
            } else {
                toast.error(data.message);
                // Revert
                setCompletedLectures(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(lectureId);
                    return newSet;
                });
            }
        } catch (error) {
            toast.error('Failed to update progress');
            // Revert
            setCompletedLectures(prev => {
                const newSet = new Set(prev);
                newSet.delete(lectureId);
                return newSet;
            });
        } finally {
            setIsMarkingComplete(false);
        }
    };

    const isLectureCompleted = (lectureId) => completedLectures.has(lectureId);

    const handleRating = (rating) => {
        addPathwayRating(id, rating);
        // Optimistically update local state if we want to show it immediately without refetch
        // For simplicity, we assume context refetch updates everything or we rely on the toast
    };

    const getUserRating = () => {
        if (!pathway?.courseRatings) return 0;
        // Since we are using Clerk, we need the user ID. 
        // We can get it from the token but easier to use useAuth/useUser hook
        // The decoded user id (Mongo ID) is what matches. 
        // Wait, standard AppContext uses `user` object from Clerk which has `id` (clerk ID).
        // Our backend stores Clerk User IDs in courseRatings usually if we set it up that way.
        // Let's check how Rating works in other places.
        // In Player.jsx: getUserRatingForCourse uses user.publicMetadata.userId/user.id or checks app state on backend. 
        // Let's implement a safe find.
        // Actually, we need the userId to check the array. 
        // Let's grab useUser
        return 0; // Placeholder until we get user object
    };

    if (loading) return <Loading />;
    if (!pathway) return null;

    const allLectures = getAllLectures();
    const currentLectureIndex = allLectures.findIndex(l =>
        l?.phaseIndex === playerData?.phaseIndex &&
        l?.chapterIndex === playerData?.chapterIndex &&
        l?.lectureIndex === playerData?.lectureIndex
    );

    return (
        <>
            <div className="min-h-screen flex flex-col">
                <div className="flex-1">
                    <div className='p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 xl:px-48 lg:px-24 md:px-16 max-w-7xl mx-auto'>
                        {/* LEFT SIDE - Navigation */}
                        <div className='text-gray-800 flex-1'>
                            <h2 className='xl:text-4xl lg:text-3xl md:text-2xl text-xl font-semibold mb-6'>{pathway.pathwayTitle}</h2>

                            <div className='pt-5'>
                                {pathway.phases.map((phase, pIndex) => (
                                    <div key={pIndex} className="border border-gray-300 bg-white mb-2 rounded">
                                        {/* Phase Header */}
                                        <div
                                            className="flex items-center justify-between px-4 py-3 cursor-pointer select-none bg-gray-50 border-b border-gray-200"
                                            onClick={() => togglePhase(pIndex)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <img className={`transform transition-transform ${expandedPhases.has(pIndex) ? "rotate-180" : ""}`} src={assets.down_arrow_icon} alt="arrow icon" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-blue-600 mb-0.5">PHASE {pIndex + 1}</span>
                                                    <p className="font-medium md:text-base text-sm">{phase.phaseTitle}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm md:text-default text-gray-500">{phase.chapters?.length} Chapters</p>
                                        </div>

                                        {/* Expanded Phase Content */}
                                        <div className={`overflow-hidden transition-all duration-300 ${expandedPhases.has(pIndex) ? "max-h-[1000px] overflow-y-auto" : "max-h-0"}`}>
                                            <div className="px-2 py-2">
                                                {phase.chapters.map((chapter, cIndex) => (
                                                    <div key={cIndex} className="mb-2 last:mb-0">
                                                        <div
                                                            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 rounded"
                                                            onClick={() => toggleChapter(pIndex, cIndex)}
                                                        >
                                                            <svg className={`w-3 h-3 text-gray-500 transition-transform ${expandedChapters.has(`${pIndex}-${cIndex}`) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                            <span className="text-sm font-medium text-gray-700">{chapter.chapterTitle}</span>
                                                        </div>

                                                        {/* Lectures */}
                                                        {expandedChapters.has(`${pIndex}-${cIndex}`) && (
                                                            <ul className="list-disc md:pl-10 pl-8 pr-4 py-1 text-gray-600">
                                                                {chapter.chapterContent.map((lecture, lIndex) => {
                                                                    const isActive = playerData?.phaseIndex === pIndex &&
                                                                        playerData?.chapterIndex === cIndex &&
                                                                        playerData?.lectureIndex === lIndex;

                                                                    return (
                                                                        <li key={lIndex} className="flex items-start gap-2 py-1">
                                                                            <img
                                                                                src={isActive ? assets.play_icon : assets.play_icon}
                                                                                alt="bullet icon"
                                                                                className={`w-4 h-4 mt-1 ${isActive ? 'brightness-0 contrast-200' : ''}`}
                                                                            />
                                                                            <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                                                                                <p className={`${isActive ? 'text-blue-600 font-semibold' : ''}`}>{lecture.lectureTitle}</p>
                                                                                <div className='flex gap-2 flex-shrink-0'>
                                                                                    {lecture.lectureUrl && <p onClick={() => setPlayerData({
                                                                                        ...lecture, phaseIndex: pIndex, chapterIndex: cIndex, lectureIndex: lIndex
                                                                                    })} className='text-blue-500 cursor-pointer'>Watch</p>}
                                                                                    <p>{humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ['m'] })}</p>
                                                                                </div>
                                                                            </div>
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Quizzes Section */}
                            {quizzes.length > 0 && (
                                <div className="border border-purple-300 bg-purple-50 mb-2 rounded mt-4">
                                    <div
                                        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                                        onClick={() => setQuizzesExpanded(!quizzesExpanded)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <img
                                                className={`transform transition-transform ${quizzesExpanded ? "rotate-180" : ""}`}
                                                src={assets.down_arrow_icon}
                                                alt="arrow icon"
                                            />
                                            <p className="font-medium md:text-base text-sm text-purple-700">Quizzes & Assignments</p>
                                        </div>
                                        <p className="text-sm md:text-default text-purple-600">{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}</p>
                                    </div>
                                    <div className={`overflow-hidden transition-all duration-300 ${quizzesExpanded ? "max-h-96 overflow-y-auto" : "max-h-0"}`}>
                                        <ul className="md:pl-10 pl-4 pr-4 py-2 border-t border-purple-200">
                                            {quizzes.map((quiz) => (
                                                <li key={quiz._id} className="flex items-start gap-2 py-2 border-b border-purple-100 last:border-b-0">
                                                    <svg className="w-5 h-5 mt-0.5 text-purple-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-800 text-sm md:text-base">{quiz.quizTitle}</p>
                                                                {quiz.quizDescription && quiz.quizDescription.trim() && (
                                                                    <p className="text-xs text-gray-600 mt-1">{quiz.quizDescription}</p>
                                                                )}
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                                                        {quiz.questions?.length || 0} questions
                                                                    </span>
                                                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                                        {quiz.duration} min
                                                                    </span>
                                                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                                                        Pass: {quiz.passingScore}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => navigate(`/quiz/${quiz._id}`)}
                                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                                                            >
                                                                Take Quiz
                                                            </button>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Documents Section */}
                            {documents.length > 0 && (
                                <div className="border border-green-300 bg-green-50 mb-2 rounded mt-4">
                                    <div
                                        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                                        onClick={() => setDocumentsExpanded(!documentsExpanded)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <img
                                                className={`transform transition-transform ${documentsExpanded ? "rotate-180" : ""}`}
                                                src={assets.down_arrow_icon}
                                                alt="arrow icon"
                                            />
                                            <p className="font-medium md:text-base text-sm text-green-700">Course Documents</p>
                                        </div>
                                        <p className="text-sm md:text-default text-green-600">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div className={`overflow-hidden transition-all duration-300 ${documentsExpanded ? "max-h-96 overflow-y-auto" : "max-h-0"}`}>
                                        <ul className="md:pl-10 pl-4 pr-4 py-2 border-t border-green-200">
                                            {documents.map((doc) => (
                                                <li key={doc.documentId} className="flex items-center justify-between gap-2 py-2 border-b border-green-100 last:border-b-0">
                                                    <div className="flex items-center gap-3">
                                                        <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8" />
                                                        </svg>
                                                        <div>
                                                            <p className="font-medium text-gray-800 text-sm md:text-base">{doc.documentTitle}</p>
                                                            <p className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={doc.documentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                                                    >
                                                        Download
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4 py-4 mt-10 bg-gray-50 p-4 rounded-lg">
                                <h1 className="lg:text-xl md:text-lg text-base font-bold text-gray-800">Rate this course:</h1>
                                <Rating
                                    initialRating={pathway?.courseRatings?.find(r => r.userId === userId)?.rating || 0}
                                    onRate={handleRating}
                                />
                                {pathway?.courseRatings?.find(r => r.userId === userId)?.rating > 0 && (
                                    <span className="text-sm text-gray-600">
                                        You rated: {pathway.courseRatings.find(r => r.userId === userId).rating}/5 stars
                                    </span>
                                )}
                                {pathway && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleFavoritePathway(pathway._id)}
                                            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center shadow-sm
                    ${isPathwayFavorite(pathway._id)
                                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-red-500'
                                                }`}
                                            title={isPathwayFavorite(pathway._id) ? 'Remove from favorites' : 'Add to favorites'}
                                        >
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill={isPathwayFavorite(pathway._id) ? 'currentColor' : 'none'}
                                                stroke="currentColor"
                                                strokeWidth={isPathwayFavorite(pathway._id) ? "0" : "2"}
                                            >
                                                <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                            </svg>
                                        </button>
                                        {isPathwayFavorite(pathway._id) && (
                                            <span className="text-sm text-red-600 font-medium">Favorited</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT SIDE - Player */}
                        <div className="flex-shrink-0 md:sticky md:top-10">
                            <div className="xl:min-w-[480px] lg:min-w-[420px] md:min-w-[380px] min-w-[300px]">
                                {playerData ? (
                                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                                        {getYouTubeVideoId(playerData.lectureUrl) ? (
                                            <YouTube
                                                videoId={getYouTubeVideoId(playerData.lectureUrl)}
                                                iframeClassName='w-full aspect-video'
                                                opts={{
                                                    playerVars: {
                                                        autoplay: 1,
                                                        modestbranding: 1,
                                                        rel: 0
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
                                                <div className="text-center p-6">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className="text-gray-500 font-medium">Invalid video URL</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className='p-6'>
                                            <h3 className='text-xl font-semibold mb-2'>{playerData.lectureTitle}</h3>
                                            <p className='text-sm text-gray-600 mb-6'>
                                                Phase {playerData.phaseIndex + 1} &gt; Chapter {playerData.chapterIndex + 1} &gt; Lecture {playerData.lectureIndex + 1}
                                            </p>
                                            <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4'>
                                                <div className='flex gap-3'>
                                                    <button
                                                        onClick={goToPrevious}
                                                        disabled={currentLectureIndex <= 0}
                                                        className='bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors'
                                                    >
                                                        Previous
                                                    </button>
                                                    <button
                                                        onClick={goToNext}
                                                        disabled={currentLectureIndex >= allLectures.length - 1}
                                                        className='bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors'
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={markLectureComplete}
                                                    disabled={isMarkingComplete || isLectureCompleted(playerData.lectureId)}
                                                    className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isLectureCompleted(playerData.lectureId)
                                                        ? 'bg-green-600 text-white cursor-not-allowed'
                                                        : isMarkingComplete
                                                            ? 'bg-gray-400 text-white cursor-wait'
                                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                        }`}
                                                >
                                                    <img src={assets.blue_tick_icon} alt="check" className="w-4 h-4" />
                                                    {isMarkingComplete ? 'Saving...' : isLectureCompleted(playerData.lectureId) ? 'Completed' : 'Mark Complete'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-lg shadow-lg overflow-hidden p-6 text-center text-gray-500">
                                        Select a lecture to start watching
                                    </div>
                                )}
                            </div>


                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );
};

export default PathwayPlayer;
