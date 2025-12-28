import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Uniqid from 'uniqid'
import Quill from 'quill'
import 'quill/dist/quill.snow.css';
import { assets } from '../../assets/assets'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'react-toastify'
import Loading from '../../components/students/Loading'
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EditPathway = () => {
    const { id } = useParams();
    const quillRef = useRef(null);
    const editorRef = useRef(null);
    const [pathwayTitle, setPathwayTitle] = useState('')
    const [pathwayPrice, setPathwayPrice] = useState(0)
    const [discount, setDiscount] = useState(0)
    const [image, setImage] = useState(null)
    const [existingImage, setExistingImage] = useState('')
    const [phases, setPhases] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [showPhaseDialog, setShowPhaseDialog] = useState(false);
    const [showChapterDialog, setShowChapterDialog] = useState(false);
    const [showLectureDialog, setShowLectureDialog] = useState(false);

    // Current context
    const [currentPhaseId, setCurrentPhaseId] = useState(null);
    const [currentChapterId, setCurrentChapterId] = useState(null);

    // Form data
    const [phaseTitle, setPhaseTitle] = useState('');
    const [chapterTitle, setChapterTitle] = useState('');
    const [lectureDetails, setLectureDetails] = useState({
        lectureTitle: '',
        lectureDuration: 0,
        lectureUrl: '',
        isPreviewFree: false,
    })

    const [pathwayDescription, setPathwayDescription] = useState('');
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Fetch pathway data
    useEffect(() => {
        const fetchPathway = async () => {
            try {
                const token = await getToken();
                const { data } = await axios.get(`${backendUrl}/api/pathway/educator/edit/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (data.success) {
                    const pathway = data.pathwayData;
                    setPathwayTitle(pathway.pathwayTitle);
                    setPathwayPrice(pathway.pathwayPrice);
                    setDiscount(pathway.discount || 0);
                    setExistingImage(pathway.pathwayThumbnail);
                    setPathwayDescription(pathway.pathwayDescription);
                    setPhases(pathway.phases || []);
                } else {
                    toast.error('Failed to load pathway');
                    navigate('/educator/my-courses');
                }
            } catch (error) {
                console.error('Fetch pathway error:', error);
                toast.error('Failed to load pathway');
                navigate('/educator/my-courses');
            } finally {
                setLoading(false);
            }
        };

        fetchPathway();
    }, [id]);

    // Initialize Quill editor
    useEffect(() => {
        if (!quillRef.current && editorRef.current && pathwayDescription) {
            quillRef.current = new Quill(editorRef.current, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                    ]
                }
            });
            quillRef.current.root.innerHTML = pathwayDescription;
        }
    }, [pathwayDescription]);

    // Phase handlers (same as AddPathway)
    const handlePhase = (action, phaseId) => {
        if (action === 'add') {
            setShowPhaseDialog(true);
        } else if (action === 'remove') {
            setPhases(phases.filter((phase) => phase.phaseId !== phaseId));
        } else if (action === 'toggle') {
            setPhases(
                phases.map((phase) =>
                    phase.phaseId === phaseId ? { ...phase, collapsed: !phase.collapsed } : phase
                )
            );
        } else if (action === 'moveUp') {
            const index = phases.findIndex(p => p.phaseId === phaseId);
            if (index > 0) {
                const newPhases = [...phases];
                [newPhases[index], newPhases[index - 1]] = [newPhases[index - 1], newPhases[index]];
                newPhases.forEach((phase, idx) => {
                    phase.phaseOrder = idx + 1;
                });
                setPhases(newPhases);
            }
        } else if (action === 'moveDown') {
            const index = phases.findIndex(p => p.phaseId === phaseId);
            if (index < phases.length - 1) {
                const newPhases = [...phases];
                [newPhases[index], newPhases[index + 1]] = [newPhases[index + 1], newPhases[index]];
                newPhases.forEach((phase, idx) => {
                    phase.phaseOrder = idx + 1;
                });
                setPhases(newPhases);
            }
        }
    };

    const addPhase = () => {
        if (phaseTitle.trim()) {
            const newPhase = {
                phaseId: Uniqid(),
                phaseTitle: phaseTitle.trim(),
                chapters: [],
                collapsed: false,
                phaseOrder: phases.length + 1,
            };
            setPhases([...phases, newPhase]);
            setShowPhaseDialog(false);
            setPhaseTitle('');
        }
    };

    // Chapter handlers
    const handleChapter = (action, phaseId, chapterId) => {
        if (action === 'add') {
            setCurrentPhaseId(phaseId);
            setShowChapterDialog(true);
        } else if (action === 'remove') {
            setPhases(
                phases.map((phase) =>
                    phase.phaseId === phaseId
                        ? { ...phase, chapters: phase.chapters.filter((ch) => ch.chapterId !== chapterId) }
                        : phase
                )
            );
        }
    };

    const addChapter = () => {
        if (chapterTitle.trim()) {
            setPhases(
                phases.map((phase) => {
                    if (phase.phaseId === currentPhaseId) {
                        const newChapter = {
                            chapterId: Uniqid(),
                            chapterTitle: chapterTitle.trim(),
                            chapterContent: [],
                            chapterOrder: phase.chapters.length + 1,
                        };
                        phase.chapters.push(newChapter);
                    }
                    return phase;
                })
            );
            setShowChapterDialog(false);
            setChapterTitle('');
        }
    };

    // Lecture handlers
    const handleLecture = (action, phaseId, chapterId) => {
        if (action === 'add') {
            setCurrentPhaseId(phaseId);
            setCurrentChapterId(chapterId);
            setShowLectureDialog(true);
        } else if (action === 'remove') {
            setPhases(
                phases.map((phase) =>
                    phase.phaseId === phaseId
                        ? {
                            ...phase,
                            chapters: phase.chapters.map((chapter) =>
                                chapter.chapterId === chapterId
                                    ? { ...chapter, chapterContent: chapter.chapterContent.filter((_, idx) => idx !== action.lectureIndex) }
                                    : chapter
                            ),
                        }
                        : phase
                )
            );
        }
    };

    const addLecture = () => {
        setPhases(
            phases.map((phase) => {
                if (phase.phaseId === currentPhaseId) {
                    phase.chapters = phase.chapters.map((chapter) => {
                        if (chapter.chapterId === currentChapterId) {
                            const newLecture = {
                                ...lectureDetails,
                                lectureOrder: chapter.chapterContent.length > 0 ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1 : 1,
                                lectureId: Uniqid()
                            };
                            chapter.chapterContent.push(newLecture);
                        }
                        return chapter;
                    });
                }
                return phase;
            })
        );
        setShowLectureDialog(false);
        setLectureDetails({
            lectureTitle: '',
            lectureDuration: 0,
            lectureUrl: '',
            isPreviewFree: false,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!pathwayTitle || !pathwayPrice || phases.length === 0) {
            return toast.error('Please fill all required fields and add at least one phase');
        }

        const description = quillRef.current ? quillRef.current.root.innerHTML : pathwayDescription;

        const pathwayData = {
            pathwayTitle,
            pathwayPrice: Number(pathwayPrice),
            discount: Number(discount),
            pathwayDescription: description,
            phases
        };

        const formData = new FormData();
        formData.append('pathwayData', JSON.stringify(pathwayData));
        if (image) {
            formData.append('image', image);
        }

        setSaving(true);
        try {
            const token = await getToken();
            const { data } = await axios.put(`${backendUrl}/api/pathway/${id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success('Pathway updated successfully!');
                navigate('/educator/my-courses');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Update pathway error:', error);
            toast.error(error.response?.data?.message || 'Failed to update pathway');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-teal-50 via-emerald-50 to-white flex flex-col items-center py-10 px-4">
            <form onSubmit={handleSubmit} className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-8 border-2 border-teal-100">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                        Edit Course Combo
                    </h1>

                </div>

                {/* Basic Info */}
                <div className="space-y-6 mb-8">
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Combo Title *</label>
                        <input
                            type="text"
                            value={pathwayTitle}
                            onChange={(e) => setPathwayTitle(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none transition"
                            placeholder="e.g., Complete Web Development Mastery"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Price (USD) *</label>
                            <input
                                type="number"
                                value={pathwayPrice}
                                onChange={(e) => setPathwayPrice(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none transition"
                                placeholder="99"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Discount (%)</label>
                            <input
                                type="number"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none transition"
                                placeholder="0"
                                min="0"
                                max="100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Combo Description *</label>
                        <div ref={editorRef} className="bg-white border-2 border-gray-300 rounded-lg min-h-[200px]"></div>
                    </div>

                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Combo Thumbnail</label>
                        <div className="flex items-center gap-4">
                            {(existingImage || image) && (
                                <img
                                    src={image ? URL.createObjectURL(image) : existingImage}
                                    alt="Thumbnail"
                                    className="w-32 h-32 object-cover rounded-lg border-2 border-teal-200"
                                />
                            )}
                            <label htmlFor="image" className="cursor-pointer">
                                <div className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-lg hover:from-teal-600 hover:to-emerald-600 transition">
                                    <span>{image || existingImage ? 'Change Image' : 'Upload Image'}</span>
                                </div>
                                <input
                                    type="file"
                                    id="image"
                                    accept="image/*"
                                    onChange={(e) => setImage(e.target.files[0])}
                                    hidden
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Phases Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-teal-700">Learning Phases</h2>
                        <button
                            type="button"
                            onClick={() => handlePhase('add')}
                            className="px-6 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg hover:from-teal-700 hover:to-emerald-700 transition font-semibold"
                        >
                            + Add Phase
                        </button>
                    </div>

                    {phases.length === 0 ? (
                        <div className="text-center py-12 bg-teal-50 rounded-lg border-2 border-dashed border-teal-300">
                            <p className="text-teal-600 font-medium">No phases added yet. Click "Add Phase" to start building your combo.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {phases.map((phase, phaseIndex) => (
                                <div key={phase.phaseId} className="border-2 border-teal-200 rounded-lg p-4 bg-gradient-to-r from-teal-50 to-emerald-50">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-teal-700">
                                                Phase {phaseIndex + 1}: {phase.phaseTitle}
                                            </h3>
                                            <span className="text-sm text-gray-600">({phase.chapters?.length || 0} chapters)</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleChapter('add', phase.phaseId)}
                                                className="px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm"
                                            >
                                                + Chapter
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handlePhase('remove', phase.phaseId)}
                                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    <div className="ml-8 space-y-3">
                                        {phase.chapters?.map((chapter, chapterIndex) => (
                                            <div key={chapter.chapterId} className="border border-teal-300 rounded-lg p-3 bg-white">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="font-semibold text-gray-800">
                                                        Chapter {chapterIndex + 1}: {chapter.chapterTitle}
                                                    </h4>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLecture('add', phase.phaseId, chapter.chapterId)}
                                                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                                        >
                                                            + Lecture
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleChapter('remove', phase.phaseId, chapter.chapterId)}
                                                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="ml-4 space-y-1">
                                                    {chapter.chapterContent?.map((lecture, lectureIndex) => (
                                                        <div key={lecture.lectureId || lectureIndex} className="flex justify-between items-center text-sm py-1 px-2 hover:bg-gray-50 rounded">
                                                            <span className="text-gray-700">
                                                                {lectureIndex + 1}. {lecture.lectureTitle} ({lecture.lectureDuration} min)
                                                                {lecture.isPreviewFree && <span className="ml-2 text-green-600 text-xs">FREE</span>}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {(!chapter.chapterContent || chapter.chapterContent.length === 0) && (
                                                        <p className="text-gray-400 text-sm italic">No lectures yet</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {(!phase.chapters || phase.chapters.length === 0) && (
                                            <p className="text-gray-400 text-sm italic">No chapters yet. Click "+ Chapter" to add one.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/educator/my-courses')}
                        className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg hover:from-teal-700 hover:to-emerald-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <span className="flex items-center justify-center gap-2">
                                <LoadingSpinner size="h-5 w-5" />
                                Updating...
                            </span>
                        ) : (
                            'Update Combo'
                        )}
                    </button>
                </div>
            </form>

            {/* Phase Dialog */}
            {showPhaseDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-teal-700">Add New Phase</h2>
                        <input
                            type="text"
                            value={phaseTitle}
                            onChange={(e) => setPhaseTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addPhase()}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none mb-4"
                            placeholder="e.g., Foundation Level"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setShowPhaseDialog(false); setPhaseTitle(''); }}
                                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={addPhase}
                                disabled={!phaseTitle.trim()}
                                className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                Add Phase
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chapter Dialog */}
            {showChapterDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-teal-700">Add New Chapter</h2>
                        <input
                            type="text"
                            value={chapterTitle}
                            onChange={(e) => setChapterTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addChapter()}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none mb-4"
                            placeholder="e.g., Introduction to JavaScript"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setShowChapterDialog(false); setChapterTitle(''); }}
                                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={addChapter}
                                disabled={!chapterTitle.trim()}
                                className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                Add Chapter
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lecture Dialog */}
            {showLectureDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md my-8">
                        <h2 className="text-xl font-bold mb-4 text-teal-700">Add New Lecture</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Lecture Title *</label>
                                <input
                                    type="text"
                                    value={lectureDetails.lectureTitle}
                                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                                    placeholder="e.g., Variables and Data Types"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Duration (minutes) *</label>
                                <input
                                    type="number"
                                    value={lectureDetails.lectureDuration}
                                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureDuration: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                                    placeholder="15"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Lecture URL *</label>
                                <input
                                    type="text"
                                    value={lectureDetails.lectureUrl}
                                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureUrl: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                                    placeholder="https://youtube.com/..."
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isPreviewFree"
                                    checked={lectureDetails.isPreviewFree}
                                    onChange={(e) => setLectureDetails({ ...lectureDetails, isPreviewFree: e.target.checked })}
                                />
                                <label htmlFor="isPreviewFree" className="text-gray-700">Free Preview</label>
                            </div>
                            <button
                                type="button"
                                onClick={addLecture}
                                disabled={!lectureDetails.lectureTitle.trim() || !lectureDetails.lectureUrl.trim() || !lectureDetails.lectureDuration}
                                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg mt-2"
                            >
                                Add Lecture
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowLectureDialog(false);
                                    setLectureDetails({ lectureTitle: '', lectureDuration: 0, lectureUrl: '', isPreviewFree: false });
                                }}
                                className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default EditPathway
