import React, { useEffect, useRef, useState } from 'react'
import Uniqid from 'uniqid'
import Quill from 'quill'
import 'quill/dist/quill.snow.css';
import { assets } from '../../assets/assets'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AddPathway = () => {
    const quillRef = useRef(null);
    const editorRef = useRef(null);
    const [pathwayTitle, setPathwayTitle] = useState('')
    const [pathwayPrice, setPathwayPrice] = useState(0)
    const [discount, setDiscount] = useState(0)
    const [image, setImage] = useState(null)
    const [phases, setPhases] = useState([]);
    const [saving, setSaving] = useState(false);

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

    // Phase handlers
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
                // Update phase orders
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
                // Update phase orders
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
                phases.map((phase) => {
                    if (phase.phaseId === phaseId) {
                        phase.chapters = phase.chapters.filter((ch) => ch.chapterId !== chapterId);
                    }
                    return phase;
                })
            );
        } else if (action === 'toggle') {
            setPhases(
                phases.map((phase) => {
                    if (phase.phaseId === phaseId) {
                        phase.chapters = phase.chapters.map((ch) =>
                            ch.chapterId === chapterId ? { ...ch, collapsed: !ch.collapsed } : ch
                        );
                    }
                    return phase;
                })
            );
        }
    };

    const addChapter = () => {
        if (chapterTitle.trim() && currentPhaseId) {
            setPhases(
                phases.map((phase) => {
                    if (phase.phaseId === currentPhaseId) {
                        const newChapter = {
                            chapterId: Uniqid(),
                            chapterTitle: chapterTitle.trim(),
                            chapterContent: [],
                            collapsed: false,
                            chapterOrder: phase.chapters.length + 1,
                        };
                        phase.chapters.push(newChapter);
                    }
                    return phase;
                })
            );
            setShowChapterDialog(false);
            setChapterTitle('');
            setCurrentPhaseId(null);
        }
    };

    // Lecture handlers
    const handleLecture = (action, phaseId, chapterId, lectureIndex) => {
        if (action === 'add') {
            setCurrentPhaseId(phaseId);
            setCurrentChapterId(chapterId);
            setShowLectureDialog(true);
        } else if (action === 'remove') {
            setPhases(
                phases.map((phase) => {
                    if (phase.phaseId === phaseId) {
                        phase.chapters = phase.chapters.map((chapter) => {
                            if (chapter.chapterId === chapterId) {
                                chapter.chapterContent.splice(lectureIndex, 1);
                            }
                            return chapter;
                        });
                    }
                    return phase;
                })
            );
        }
    };

    const addLecture = () => {
        if (lectureDetails.lectureTitle.trim() && currentPhaseId && currentChapterId) {
            setPhases(
                phases.map((phase) => {
                    if (phase.phaseId === currentPhaseId) {
                        phase.chapters = phase.chapters.map((chapter) => {
                            if (chapter.chapterId === currentChapterId) {
                                const newLecture = {
                                    ...lectureDetails,
                                    lectureOrder: chapter.chapterContent.length + 1,
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
            setCurrentPhaseId(null);
            setCurrentChapterId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!pathwayTitle) return toast.error('Please provide a pathway title')
        if (phases.length === 0) return toast.error('Please add at least one phase')

        setSaving(true);

        try {
            const token = await getToken()

            const payload = {
                pathwayTitle,
                pathwayDescription,
                pathwayPrice: Number(pathwayPrice) || 0,
                discount: Number(discount) || 0,
                phases: phases || []
            }

            const form = new FormData()
            form.append('pathwayData', JSON.stringify(payload))
            if (image) form.append('image', image)

            const backendUrl = import.meta.env.VITE_BACKEND_URL

            const { data } = await axios.post(backendUrl + '/api/pathway/create', form, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (data.success) {
                toast.success(data.message || 'Pathway submitted for review! Please wait for approval.');
                // reset form
                setPathwayTitle('')
                setPathwayDescription('')
                setPathwayPrice(0)
                setDiscount(0)
                setImage(null)
                setPhases([])
                navigate('/educator')
            } else {
                toast.error(data.message || 'Failed to create pathway')
            }
        } catch (err) {
            console.error('AddPathway error', err)
            toast.error(err?.response?.data?.message || err.message || 'Server error')
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        if (!quillRef.current && editorRef.current) {
            quillRef.current = new Quill(editorRef.current, {
                theme: 'snow',
            });
            quillRef.current.on('text-change', () => {
                setPathwayDescription(quillRef.current.root.innerHTML);
            });
        }
    }, []);

    // Count total stats
    const getTotalStats = () => {
        let totalChapters = 0;
        let totalLectures = 0;
        phases.forEach(phase => {
            totalChapters += phase.chapters?.length || 0;
            phase.chapters?.forEach(chapter => {
                totalLectures += chapter.chapterContent?.length || 0;
            });
        });
        return { totalChapters, totalLectures };
    };

    const stats = getTotalStats();

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-white flex flex-col items-center py-10 px-2">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-8 border-2 border-teal-100">
                {/* Header with gradient */}
                <div className="text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600 opacity-10 rounded-lg blur-xl"></div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-2 relative">
                        Create Course Combo
                    </h1>
                    <p className="text-gray-600 text-sm relative">Bundle multiple course phases into one comprehensive learning package</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Combo Title */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Combo Title</label>
                        <input
                            onChange={e => setPathwayTitle(e.target.value)}
                            value={pathwayTitle}
                            type="text"
                            placeholder="e.g., Full Stack Web Developer Complete Bundle"
                            className="outline-none py-3 px-4 rounded-lg border border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 w-full text-lg"
                            required
                        />
                    </div>

                    {/* Combo Description */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Combo Description</label>
                        <div ref={editorRef} className="quill-fix bg-gray-50 rounded-lg border border-gray-200 min-h-[120px]" style={{ minHeight: 180 }} />
                    </div>

                    {/* Price & Thumbnail */}
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <label className="block text-gray-700 font-semibold mb-1">Combo Price</label>
                            <input
                                onChange={e => setPathwayPrice(e.target.value)}
                                value={pathwayPrice}
                                type="number"
                                placeholder="0"
                                className="outline-none py-3 px-4 rounded-lg border border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 w-full text-lg"
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-gray-700 font-semibold mb-1">Combo Thumbnail</label>
                            <label htmlFor="thumbnailImage" className="flex items-center gap-3 cursor-pointer">
                                <img src={assets.file_upload_icon} alt="Upload\" className="p-3 bg-gradient-to-br from-teal-500 to-emerald-500 rounded shadow" />
                                <input type="file" id="thumbnailImage" onChange={e => setImage(e.target.files[0])} accept="image/*" hidden />
                                {image && <img className="max-h-14 rounded shadow" src={URL.createObjectURL(image)} alt="thumbnail preview" />}
                                {!image && <span className="text-gray-400">No file chosen</span>}
                            </label>
                        </div>
                    </div>

                    {/* Discount */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Discount %</label>
                        <input
                            onChange={e => setDiscount(e.target.value)}
                            value={discount}
                            type="number"
                            placeholder="0"
                            min={0}
                            max={100}
                            className="outline-none py-3 px-4 rounded-lg border border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 w-32 text-lg"
                            required
                        />
                    </div>

                    {/* Phases Section */}
                    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-4 border-2 border-teal-200">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-lg font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Combo Structure</h2>
                                <p className="text-xs text-gray-600">
                                    {phases.length} Phase{phases.length !== 1 ? 's' : ''} • {stats.totalChapters} Chapter{stats.totalChapters !== 1 ? 's' : ''} • {stats.totalLectures} Lecture{stats.totalLectures !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <button type="button" onClick={() => handlePhase('add')} className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition">
                                + Add Phase
                            </button>
                        </div>

                        <div className="space-y-4">
                            {phases.map((phase, phaseIndex) => (
                                <div key={phase.phaseId} className="bg-white border-2 border-teal-300 rounded-lg shadow-md">
                                    <div className="flex justify-between items-center p-4 border-b border-teal-200 bg-gradient-to-r from-teal-100 to-emerald-100">
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => handlePhase('toggle', phase.phaseId)} className="focus:outline-none">
                                                <img src={assets.dropdown_icon} width={18} alt="toggle" className={`transition-transform ${phase.collapsed ? 'rotate-90' : ''}`} />
                                            </button>
                                            <span className="font-bold text-teal-700">Phase {phaseIndex + 1}:</span>
                                            <span className="font-semibold text-gray-800">{phase.phaseTitle}</span>
                                            <span className="text-xs text-gray-500 ml-2">({phase.chapters?.length || 0} chapters)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handlePhase('moveUp', phase.phaseId)}
                                                disabled={phaseIndex === 0}
                                                className="hover:bg-teal-200 p-1 rounded disabled:opacity-30"
                                                title="Move up"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handlePhase('moveDown', phase.phaseId)}
                                                disabled={phaseIndex === phases.length - 1}
                                                className="hover:bg-teal-200 p-1 rounded disabled:opacity-30"
                                                title="Move down"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            <button type="button" onClick={() => handlePhase('remove', phase.phaseId)} className="hover:bg-red-100 p-1 rounded">
                                                <img src={assets.cross_icon} alt="Remove" width={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {!phase.collapsed && (
                                        <div className="p-4 space-y-3">
                                            {/* Chapters */}
                                            {phase.chapters?.map((chapter, chapterIndex) => (
                                                <div key={chapter.chapterId} className="bg-gray-50 border rounded-lg shadow-sm">
                                                    <div className="flex justify-between items-center p-3 border-b bg-blue-50">
                                                        <div className="flex items-center gap-2">
                                                            <button type="button" onClick={() => handleChapter('toggle', phase.phaseId, chapter.chapterId)} className="focus:outline-none">
                                                                <img src={assets.dropdown_icon} width={16} alt="toggle" className={`transition-transform ${chapter.collapsed ? 'rotate-90' : ''}`} />
                                                            </button>
                                                            <span className="font-semibold text-blue-700">Chapter {chapterIndex + 1}:</span>
                                                            <span className="text-gray-700">{chapter.chapterTitle}</span>
                                                            <span className="text-xs text-gray-500 ml-2">({chapter.chapterContent?.length || 0} lectures)</span>
                                                        </div>
                                                        <button type="button" onClick={() => handleChapter('remove', phase.phaseId, chapter.chapterId)} className="hover:bg-red-100 p-1 rounded">
                                                            <img src={assets.cross_icon} alt="Remove" width={16} />
                                                        </button>
                                                    </div>

                                                    {!chapter.collapsed && (
                                                        <div className="p-3 space-y-2">
                                                            {chapter.chapterContent?.map((lecture, lectureIndex) => (
                                                                <div key={lecture.lectureId} className="flex justify-between items-center bg-white rounded px-3 py-2 border">
                                                                    <span className="text-sm text-gray-700">
                                                                        {lectureIndex + 1}. {lecture.lectureTitle} - {lecture.lectureDuration} mins -
                                                                        <a href={lecture.lectureUrl} target="_blank" className="text-blue-500 underline ml-1" rel="noreferrer">Link</a> -
                                                                        {lecture.isPreviewFree ? <span className="text-green-600 font-medium ml-1">Free Preview</span> : <span className="text-gray-400 ml-1">Paid</span>}
                                                                    </span>
                                                                    <button type="button" onClick={() => handleLecture('remove', phase.phaseId, chapter.chapterId, lectureIndex)} className="hover:bg-red-100 p-1 rounded">
                                                                        <img src={assets.cross_icon} alt="Remove" width={14} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button type="button" onClick={() => handleLecture('add', phase.phaseId, chapter.chapterId)} className="inline-flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded mt-2 font-medium transition text-sm">
                                                                + Add Lecture
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            <button type="button" onClick={() => handleChapter('add', phase.phaseId)} className="inline-flex items-center gap-1 bg-teal-100 hover:bg-teal-200 text-teal-700 px-3 py-2 rounded font-medium transition">
                                                + Add Chapter to Phase {phaseIndex + 1}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {phases.length === 0 && <div className="text-gray-400 text-center py-4">No phases added yet. Click "Add Phase" to start building your combo.</div>}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={saving}
                        className={`w-full py-3 rounded-lg font-bold text-lg shadow-lg transition flex items-center justify-center gap-2 ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white'
                            }`}
                    >
                        {saving ? (
                            <>
                                <LoadingSpinner size="h-5 w-5" color="text-white" />
                                Creating Combo...
                            </>
                        ) : 'Create Combo'}
                    </button>
                </form>
            </div>

            {/* Dialog Add Phase */}
            {showPhaseDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50 animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative animate-scaleIn">
                        <button onClick={() => { setShowPhaseDialog(false); setPhaseTitle(''); }} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl">&times;</button>
                        <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Add Phase</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Phase Title</label>
                                <input
                                    type="text"
                                    className="block w-full border rounded py-2 px-3 outline-none focus:border-teal-400"
                                    value={phaseTitle}
                                    onChange={e => setPhaseTitle(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && addPhase()}
                                    placeholder="e.g., Phase 1: Frontend Fundamentals"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={addPhase}
                                    disabled={!phaseTitle.trim()}
                                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg transition"
                                >
                                    Add Phase
                                </button>
                                <button
                                    onClick={() => { setShowPhaseDialog(false); setPhaseTitle(''); }}
                                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dialog Add Chapter */}
            {showChapterDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50 animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative animate-scaleIn">
                        <button onClick={() => { setShowChapterDialog(false); setChapterTitle(''); setCurrentPhaseId(null); }} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl">&times;</button>
                        <h2 className="text-xl font-bold mb-4 text-blue-700">Add Chapter</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Chapter Title</label>
                                <input
                                    type="text"
                                    className="block w-full border rounded py-2 px-3 outline-none focus:border-blue-400"
                                    value={chapterTitle}
                                    onChange={e => setChapterTitle(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && addChapter()}
                                    placeholder="e.g., HTML Basics"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={addChapter}
                                    disabled={!chapterTitle.trim()}
                                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg transition"
                                >
                                    Add Chapter
                                </button>
                                <button
                                    onClick={() => { setShowChapterDialog(false); setChapterTitle(''); setCurrentPhaseId(null); }}
                                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dialog Add Lecture */}
            {showLectureDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50 animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative animate-scaleIn">
                        <button onClick={() => setShowLectureDialog(false)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl">&times;</button>
                        <h2 className="text-xl font-bold mb-4 text-blue-700">Add Lecture</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Lecture Title</label>
                                <input type="text" className="block w-full border rounded py-2 px-3 outline-none focus:border-blue-400" value={lectureDetails.lectureTitle} onChange={e => setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Lecture Duration (minutes)</label>
                                <input type="number" className="block w-full border rounded py-2 px-3 outline-none focus:border-blue-400" value={lectureDetails.lectureDuration} onChange={e => setLectureDetails({ ...lectureDetails, lectureDuration: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Lecture URL</label>
                                <input type="text" className="block w-full border rounded py-2 px-3 outline-none focus:border-blue-400" value={lectureDetails.lectureUrl} onChange={e => setLectureDetails({ ...lectureDetails, lectureUrl: e.target.value })} />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="isPreviewFree" checked={lectureDetails.isPreviewFree} onChange={e => setLectureDetails({ ...lectureDetails, isPreviewFree: e.target.checked })} />
                                <label htmlFor="isPreviewFree" className="text-gray-700">Free Preview</label>
                            </div>
                            <button
                                onClick={addLecture}
                                disabled={!lectureDetails.lectureTitle.trim() || !lectureDetails.lectureUrl.trim() || !lectureDetails.lectureDuration}
                                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg mt-2"
                            >
                                Add Lecture
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AddPathway
