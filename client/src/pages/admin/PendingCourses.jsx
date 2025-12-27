import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { Sparkles, X, ChevronDown } from 'lucide-react';
import YouTube from 'react-youtube';
import humanizeDuration from 'humanize-duration';

const PendingCourses = () => {
    const [courses, setCourses] = useState([]);
    const [pathways, setPathways] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('courses'); // 'courses' or 'combos'
    const [rejectionReason, setRejectionReason] = useState('');

    // Detail modal state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [openSections, setOpenSections] = useState({});
    const [playerData, setPlayerData] = useState(null);

    // Confirmation modal state
    const [modal, setModal] = useState({
        isOpen: false,
        action: null,
        item: { id: null, title: null, type: null }
    });

    // Fetch pending courses
    const fetchPendingCourses = async () => {
        try {
            const response = await api.get('/api/admin/courses/pending');
            if (response.success) {
                setCourses(response.courses || []);
            }
        } catch (error) {
            console.error('Fetch pending courses error:', error);
        }
    };

    // Fetch pending pathways
    const fetchPendingPathways = async () => {
        try {
            const response = await api.get('/api/admin/pathways/pending');
            if (response.success) {
                setPathways(response.pathways || []);
            }
        } catch (error) {
            console.error('Fetch pending pathways error:', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchPendingCourses(), fetchPendingPathways()]);
            setLoading(false);
        };
        loadData();
    }, []);

    // Toggle section collapse
    const toggleSection = (index) => {
        setOpenSections((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    // Get all lectures for navigation
    const getAllLectures = () => {
        if (!selectedItem) return [];
        let allLectures = [];

        if (selectedItem.type === 'course') {
            selectedItem.courseContent?.forEach((chapter, chapterIndex) => {
                chapter.chapterContent?.forEach((lecture, lectureIndex) => {
                    allLectures.push({
                        ...lecture,
                        chapter: chapterIndex + 1,
                        lecture: lectureIndex + 1,
                        chapterIndex,
                        lectureIndex,
                        chapterTitle: chapter.chapterTitle
                    });
                });
            });
        } else {
            // Pathway
            selectedItem.phases?.forEach((phase, phaseIndex) => {
                phase.chapters?.forEach((chapter, chapterIndex) => {
                    chapter.chapterContent?.forEach((lecture, lectureIndex) => {
                        allLectures.push({
                            ...lecture,
                            phase: phaseIndex + 1,
                            chapter: chapterIndex + 1,
                            lecture: lectureIndex + 1,
                            phaseTitle: phase.phaseTitle,
                            chapterTitle: chapter.chapterTitle
                        });
                    });
                });
            });
        }
        return allLectures;
    };

    // Navigation
    const goToPrevious = () => {
        const allLectures = getAllLectures();
        const currentIndex = allLectures.findIndex(l => l.lectureId === playerData?.lectureId);
        if (currentIndex > 0) {
            setPlayerData(allLectures[currentIndex - 1]);
        }
    };

    const goToNext = () => {
        const allLectures = getAllLectures();
        const currentIndex = allLectures.findIndex(l => l.lectureId === playerData?.lectureId);
        if (currentIndex < allLectures.length - 1) {
            setPlayerData(allLectures[currentIndex + 1]);
        }
    };

    // Get YouTube video ID
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

    // Open confirmation modal
    const openModal = (action, id, title, type) => {
        setModal({ isOpen: true, action, item: { id, title, type } });
        setRejectionReason('');
    };

    const closeModal = () => {
        setModal({ isOpen: false, action: null, item: { id: null, title: null, type: null } });
        setRejectionReason('');
    };

    // Execute approve/reject action
    const executeAction = async () => {
        const { id, type } = modal.item;
        const { action } = modal;

        if (action === 'reject' && !rejectionReason.trim()) {
            toast.error('Please provide a rejection reason.');
            return;
        }

        closeModal();

        try {
            const endpoint = type === 'course'
                ? `/api/admin/courses/${action}`
                : `/api/admin/pathways/${action}`;

            const idField = type === 'course' ? 'courseId' : 'pathwayId';
            const body = action === 'approve'
                ? { [idField]: id }
                : { [idField]: id, rejectionReason };

            const response = await api.post(endpoint, body);

            if (response.success) {
                toast.success(action === 'approve'
                    ? `${type === 'course' ? 'Course' : 'Combo'} approved!`
                    : `${type === 'course' ? 'Course' : 'Combo'} rejected.`
                );
                if (type === 'course') {
                    fetchPendingCourses();
                } else {
                    fetchPendingPathways();
                }
            }
        } catch (error) {
            console.error(`${action} error:`, error);
            toast.error(`Failed to ${action}.`);
        }
    };

    // Open detail modal
    const openDetailModal = (item, type) => {
        setSelectedItem({ ...item, type });
        setShowDetailModal(true);
        setPlayerData(null);
        setOpenSections({});
    };

    // Close detail modal
    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedItem(null);
        setPlayerData(null);
    };

    if (loading) {
        return <div className="text-center py-10">Loading pending approvals...</div>;
    }

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            {/* Header with Tabs */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">
                    Pending Approvals
                </h1>

                {/* Tab Switcher */}
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setViewMode('courses')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'courses'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-white'
                            }`}
                    >
                        Individual Courses ({courses.length})
                    </button>
                    <button
                        onClick={() => setViewMode('combos')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'combos'
                            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-white'
                            }`}
                    >
                        Course Combos ({pathways.length})
                    </button>
                </div>
            </div>

            {/* Courses List */}
            {viewMode === 'courses' && (
                courses.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-lg flex items-center justify-center gap-2"><Sparkles size={20} /> No courses pending approval!</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {courses.map((course) => (
                            <div key={course._id} className="flex flex-col md:flex-row bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
                                <div className="md:w-48 h-32 md:h-auto flex-shrink-0 bg-gray-100">
                                    <img src={course.courseThumbnail} alt={course.courseTitle} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-4 flex flex-col justify-between flex-grow">
                                    <div>
                                        <div className='flex justify-between items-start'>
                                            <h3 className="text-xl font-semibold text-gray-800 mb-1">{course.courseTitle}</h3>
                                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">Pending</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">By: {course.educator?.name || 'Unknown'}</p>
                                        <div className="flex gap-4 text-sm text-gray-600">
                                            <span>Price: <b>${course.coursePrice}</b></span>
                                            <span>Chapters: <b>{course.courseContent?.length || 0}</b></span>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-3 justify-end items-center border-t pt-3">
                                        <button
                                            onClick={() => openDetailModal(course, 'course')}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-auto"
                                        >
                                            View Details →
                                        </button>
                                        <button onClick={() => openModal('reject', course._id, course.courseTitle, 'course')} className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">Reject</button>
                                        <button onClick={() => openModal('approve', course._id, course.courseTitle, 'course')} className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition shadow-sm">Approve & Publish</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Combos List */}
            {viewMode === 'combos' && (
                pathways.length === 0 ? (
                    <div className="text-center py-12 text-teal-500 bg-teal-50 rounded-lg border border-dashed border-teal-300">
                        <p className="text-lg flex items-center justify-center gap-2"><Sparkles size={20} /> No combos pending!</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {pathways.map((pathway) => (
                            <div key={pathway._id} className="flex flex-col md:flex-row bg-white border-2 border-teal-200 rounded-lg overflow-hidden hover:shadow-md transition">
                                <div className="md:w-48 h-32 md:h-auto flex-shrink-0 bg-gray-100 relative">
                                    <img src={pathway.pathwayThumbnail} alt={pathway.pathwayTitle} className="w-full h-full object-cover" />
                                    <div className="absolute top-2 left-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs px-2 py-1 rounded-full font-bold">COMBO</div>
                                </div>
                                <div className="p-4 flex flex-col justify-between flex-grow">
                                    <div>
                                        <div className='flex justify-between items-start'>
                                            <h3 className="text-xl font-semibold text-gray-800 mb-1">{pathway.pathwayTitle}</h3>
                                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">Pending</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">By: {pathway.educator?.name || 'Unknown'}</p>
                                        <div className="flex gap-4 text-sm text-gray-600">
                                            <span>Price: <b>${pathway.pathwayPrice}</b></span>
                                            <span>Phases: <b>{pathway.phases?.length || 0}</b></span>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-3 justify-end items-center border-t pt-3">
                                        <button onClick={() => openDetailModal(pathway, 'pathway')} className="text-teal-600 hover:text-teal-800 text-sm font-medium mr-auto">View Details →</button>
                                        <button onClick={() => openModal('reject', pathway._id, pathway.pathwayTitle, 'pathway')} className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">Reject</button>
                                        <button onClick={() => openModal('approve', pathway._id, pathway.pathwayTitle, 'pathway')} className="px-4 py-2 text-sm text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-lg transition shadow-sm">Approve & Publish</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Detail Modal - Player-like Layout */}
            {showDetailModal && selectedItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className={`p-4 border-b flex justify-between items-center ${selectedItem.type === 'pathway'
                            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white'
                            : 'bg-blue-600 text-white'
                            }`}>
                            <div>
                                <h2 className="text-xl font-bold">
                                    {selectedItem.type === 'pathway' ? selectedItem.pathwayTitle : selectedItem.courseTitle}
                                </h2>
                                <p className="text-sm opacity-90">
                                    By: {selectedItem.educator?.name} | Price: ${selectedItem.type === 'pathway' ? selectedItem.pathwayPrice : selectedItem.coursePrice}
                                </p>
                            </div>
                            <button onClick={closeDetailModal} className="p-2 hover:bg-white/20 rounded-full transition"><X size={24} /></button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            {/* LEFT SIDE - Course Structure */}
                            <div className="w-full md:w-2/5 border-r overflow-y-auto bg-white p-4">
                                {/* Description */}
                                <div className="mb-4 pb-4 border-b">
                                    <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                                    <div
                                        className="text-sm text-gray-600 prose max-w-none"
                                        dangerouslySetInnerHTML={{ __html: selectedItem.type === 'pathway' ? selectedItem.pathwayDescription : selectedItem.courseDescription }}
                                    />
                                </div>

                                {/* Curriculum */}
                                <h3 className="font-semibold text-gray-800 mb-3">
                                    {selectedItem.type === 'pathway' ? 'Combo Curriculum' : 'Course Curriculum'}
                                </h3>

                                {selectedItem.type === 'course' ? (
                                    // Course chapters
                                    selectedItem.courseContent?.map((chapter, idx) => (
                                        <div key={idx} className="border border-gray-200 bg-white mb-2 rounded">
                                            <div
                                                className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-gray-50"
                                                onClick={() => toggleSection(idx)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ChevronDown className={`w-4 h-4 transform transition-transform ${openSections[idx] ? 'rotate-180' : ''}`} />
                                                    <p className="font-medium text-sm">{chapter.chapterTitle}</p>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {chapter.chapterContent?.length || 0} lectures - {humanizeDuration((chapter.chapterContent?.reduce((sum, l) => sum + (l.lectureDuration || 0), 0) || 0) * 60 * 1000, { units: ['h', 'm'] })}
                                                </p>
                                            </div>
                                            <div className={`overflow-hidden transition-all duration-300 ${openSections[idx] ? 'max-h-[500px]' : 'max-h-0'}`}>
                                                <ul className="pl-6 pr-4 py-2 border-t border-gray-200">
                                                    {chapter.chapterContent?.map((lecture, lIdx) => (
                                                        <li
                                                            key={lIdx}
                                                            className={`flex items-center justify-between py-2 cursor-pointer hover:bg-blue-50 rounded px-2 ${playerData?.lectureId === lecture.lectureId ? 'bg-blue-100' : ''}`}
                                                            onClick={() => setPlayerData({ ...lecture, chapter: idx + 1, lecture: lIdx + 1, chapterTitle: chapter.chapterTitle })}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">{lIdx + 1}</span>
                                                                <span className="text-sm">{lecture.lectureTitle}</span>
                                                                {lecture.isPreviewFree && <span className="text-xs text-green-600 font-medium">FREE</span>}
                                                            </div>
                                                            <span className="text-xs text-gray-500">{lecture.lectureDuration} min</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    // Pathway phases
                                    selectedItem.phases?.map((phase, pIdx) => (
                                        <div key={pIdx} className="border-2 border-teal-200 bg-teal-50/30 mb-3 rounded-lg">
                                            <div className="px-4 py-2 font-bold text-teal-700 border-b border-teal-200">
                                                Phase {pIdx + 1}: {phase.phaseTitle}
                                            </div>
                                            <div className="p-2">
                                                {phase.chapters?.map((chapter, cIdx) => (
                                                    <div key={cIdx} className="border border-gray-200 bg-white mb-2 rounded">
                                                        <div
                                                            className="flex items-center justify-between px-3 py-2 cursor-pointer select-none hover:bg-gray-50"
                                                            onClick={() => toggleSection(`${pIdx}-${cIdx}`)}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <ChevronDown className={`w-4 h-4 transform transition-transform ${openSections[`${pIdx}-${cIdx}`] ? 'rotate-180' : ''}`} />
                                                                <p className="font-medium text-sm">{chapter.chapterTitle}</p>
                                                            </div>
                                                            <p className="text-xs text-gray-500">{chapter.chapterContent?.length || 0} lectures</p>
                                                        </div>
                                                        <div className={`overflow-hidden transition-all duration-300 ${openSections[`${pIdx}-${cIdx}`] ? 'max-h-[500px]' : 'max-h-0'}`}>
                                                            <ul className="pl-6 pr-4 py-2 border-t border-gray-200">
                                                                {chapter.chapterContent?.map((lecture, lIdx) => (
                                                                    <li
                                                                        key={lIdx}
                                                                        className={`flex items-center justify-between py-2 cursor-pointer hover:bg-teal-50 rounded px-2 ${playerData?.lectureId === lecture.lectureId ? 'bg-teal-100' : ''}`}
                                                                        onClick={() => setPlayerData({ ...lecture, phase: pIdx + 1, chapter: cIdx + 1, lecture: lIdx + 1, phaseTitle: phase.phaseTitle, chapterTitle: chapter.chapterTitle })}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs">{lIdx + 1}</span>
                                                                            <span className="text-sm">{lecture.lectureTitle}</span>
                                                                            {lecture.isPreviewFree && <span className="text-xs text-green-600 font-medium">FREE</span>}
                                                                        </div>
                                                                        <span className="text-xs text-gray-500">{lecture.lectureDuration} min</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* RIGHT SIDE - Video Player */}
                            <div className="w-full md:w-3/5 bg-gray-900 flex flex-col">
                                {playerData ? (
                                    <>
                                        {/* Video Player */}
                                        <div className="flex-1 min-h-[300px]">
                                            {getYouTubeVideoId(playerData.lectureUrl) ? (
                                                <YouTube
                                                    videoId={getYouTubeVideoId(playerData.lectureUrl)}
                                                    iframeClassName='w-full h-full'
                                                    className="w-full h-full"
                                                    opts={{
                                                        width: '100%',
                                                        height: '100%',
                                                        playerVars: { autoplay: 1, modestbranding: 1, rel: 0 }
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white">
                                                    <div className="text-center">
                                                        <p className="text-lg font-medium">Invalid Video URL</p>
                                                        <p className="text-sm text-gray-400 mt-2">{playerData.lectureUrl}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {/* Video Info & Navigation */}
                                        <div className="bg-white p-4">
                                            <h3 className="text-lg font-semibold mb-1">{playerData.lectureTitle}</h3>
                                            <p className="text-sm text-gray-600 mb-4">
                                                {playerData.phaseTitle ? `Phase ${playerData.phase}: ${playerData.phaseTitle}` : ''}
                                                {playerData.phaseTitle && ' → '}
                                                Chapter {playerData.chapter}: {playerData.chapterTitle} → Lecture {playerData.lecture}
                                            </p>
                                            <div className="flex justify-between items-center">
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={goToPrevious}
                                                        disabled={getAllLectures().findIndex(l => l.lectureId === playerData.lectureId) === 0}
                                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-medium transition"
                                                    >
                                                        ← Previous
                                                    </button>
                                                    <button
                                                        onClick={goToNext}
                                                        disabled={getAllLectures().findIndex(l => l.lectureId === playerData.lectureId) === getAllLectures().length - 1}
                                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-medium transition"
                                                    >
                                                        Next →
                                                    </button>
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    Lecture {getAllLectures().findIndex(l => l.lectureId === playerData.lectureId) + 1} of {getAllLectures().length}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    // No video selected
                                    <div className="flex-1 flex flex-col items-center justify-center text-white">
                                        <img
                                            src={selectedItem.type === 'pathway' ? selectedItem.pathwayThumbnail : selectedItem.courseThumbnail}
                                            alt="Thumbnail"
                                            className="w-64 h-40 object-cover rounded-lg shadow-lg mb-6"
                                        />
                                        <p className="text-lg font-medium">Select a lecture to start watching</p>
                                        <p className="text-sm text-gray-400 mt-2">Click on any lecture from the left panel</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer - Actions */}
                        <div className="p-4 border-t bg-white flex justify-end gap-3">
                            <button onClick={closeDetailModal} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition">Close</button>
                            <button
                                onClick={() => { closeDetailModal(); openModal('reject', selectedItem._id, selectedItem.type === 'pathway' ? selectedItem.pathwayTitle : selectedItem.courseTitle, selectedItem.type); }}
                                className="px-6 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => { closeDetailModal(); openModal('approve', selectedItem._id, selectedItem.type === 'pathway' ? selectedItem.pathwayTitle : selectedItem.courseTitle, selectedItem.type); }}
                                className={`px-6 py-2 text-white rounded-lg transition shadow-sm ${selectedItem.type === 'pathway'
                                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700'
                                    : 'bg-green-600 hover:bg-green-700'
                                    }`}
                            >
                                Approve & Publish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                onConfirm={executeAction}
                title={modal.action === 'approve' ? 'Approve & Publish' : 'Reject'}
                message={
                    <div>
                        <p className="mb-4">
                            {modal.action === 'approve'
                                ? `Are you sure you want to approve "${modal.item.title}"?`
                                : `Are you sure you want to reject "${modal.item.title}"?`
                            }
                        </p>
                        {modal.action === 'reject' && (
                            <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for rejection:</label>
                                <textarea
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                                    rows="3"
                                    placeholder="Content violates copyright, Low audio quality..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                ></textarea>
                            </div>
                        )}
                    </div>
                }
                confirmText={modal.action === 'approve' ? 'Approve' : 'Reject'}
                confirmColor={modal.action === 'approve' ? 'bg-green-600' : 'bg-red-500'}
            />
        </div>
    );
};

export default PendingCourses;