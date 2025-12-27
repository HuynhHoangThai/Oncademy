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

const AddCourse = () => {
  const quillRef = useRef(null);
  const editorRef = useRef(null);
  const [courseTitle, setCourseTitle] = useState('')
  const [coursePrice, setCoursePrice] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [image, setImage] = useState(null)
  const [chapters, setChapters] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showChapterDialog, setShowChapterDialog] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: '',
    lectureDuration: 0,
    lectureUrl: '',
    isPreviewFree: false,
  })
  const [courseDescription, setCourseDescription] = useState('');
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const handleChapter = (action, chapterId) => {
    if (action === 'add') {
      setShowChapterDialog(true);
    } else if (action === 'remove') {
      setChapters(chapters.filter((chapter) => chapter.chapterId !== chapterId));
    } else if (action === 'toggle') {
      setChapters(
        chapters.map((chapter) =>
          chapter.chapterId === chapterId ? { ...chapter, collapsed: !chapter.collapsed } : chapter
        )
      );
    }
  };

  const addChapter = () => {
    if (chapterTitle.trim()) {
      const newChapter = {
        chapterId: Uniqid(),
        chapterTitle: chapterTitle.trim(),
        chapterContent: [],
        collapsed: false,
        chapterOrder: chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
      };
      setChapters([...chapters, newChapter]);
      setShowChapterDialog(false);
      setChapterTitle('');
    }
  };
  const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === 'add') {
      setCurrentChapterId(chapterId);
      setShowPopup(true);
    } else if (action === 'remove') {
      setChapters(
        chapters.map((chapter) => {
          if (chapter.chapterId === chapterId) {
            chapter.chapterContent.splice(lectureIndex, 1);
          }
          return chapter;
        })
      );
    }
  };
  const addLecture = () => {
    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === currentChapterId) {
          const newLecture = {
            ...lectureDetails,
            lectureOrder: chapter.chapterContent.length > 0 ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1 : 1,
            lectureId: Uniqid()
          };
          chapter.chapterContent.push(newLecture);
        }
        return chapter;
      })
    );
    setShowPopup(false);
    setLectureDetails({
      lectureTitle: '',
      lectureDuration: '',
      lectureUrl: '',
      isPreviewFree: false,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseTitle) return toast.error('Please provide a course title')
    setSaving(true);

    try {
      const token = await getToken()

      const payload = {
        courseTitle,
        courseDescription,
        coursePrice: Number(coursePrice) || 0,
        discount: Number(discount) || 0,
        courseContent: chapters || []
      }

      const form = new FormData()
      form.append('courseData', JSON.stringify(payload))
      if (image) form.append('image', image)

      const backendUrl = import.meta.env.VITE_BACKEND_URL

      const { data } = await axios.post(backendUrl + '/api/educator/add-course', form, {
        headers: {
          Authorization: `Bearer ${token}`
          // Note: let browser set Content-Type with boundary
        }
      })

      if (data.success) {
        toast.success(data.message || 'Course submitted for review! Please wait for approval.');
        // reset form
        setCourseTitle('')
        setCourseDescription('')
        setCoursePrice(0)
        setDiscount(0)
        setImage(null)
        setChapters([])
        // optionally navigate to educator dashboard
        navigate('/educator')
      } else {
        toast.error(data.message || 'Failed to create course')
      }
    } catch (err) {
      console.error('AddCourse error', err)
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
        setCourseDescription(quillRef.current.root.innerHTML);
      });
    }
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-700 mb-2">Create a New Course</h1>
          <p className="text-gray-600 text-sm mb-4">Create courses or course combo</p>

          {/* Combo Option */}
          <div className="inline-flex items-center gap-3 p-3 bg-gradient-to-r from-teal-100 to-emerald-100 border-2 border-teal-300 rounded-lg">
            <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            <span className="text-gray-700 font-medium">Want to create a Course Combo?</span>
            <button
              type="button"
              onClick={() => navigate('/educator/add-pathway')}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-4 py-1.5 rounded-lg font-semibold text-sm shadow transition"
            >
              Create
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Course Title */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Course Title</label>
            <input onChange={e => setCourseTitle(e.target.value)} value={courseTitle} type="text" placeholder="Type here" className="outline-none py-3 px-4 rounded-lg border border-gray-300 focus:border-blue-400 w-full text-lg" required />
          </div>
          {/* Course Description */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Course Description</label>
            <div ref={editorRef} className="quill-fix bg-gray-50 rounded-lg border border-gray-200 min-h-[120px]" style={{ minHeight: 180 }} />
          </div>
          {/* Price & Thumbnail */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-gray-700 font-semibold mb-1">Course Price</label>
              <input onChange={e => setCoursePrice(e.target.value)} value={coursePrice} type="number" placeholder="0" className="outline-none py-3 px-4 rounded-lg border border-gray-300 focus:border-blue-400 w-full text-lg" required />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 font-semibold mb-1">Course Thumbnail</label>
              <label htmlFor="thumbnailImage" className="flex items-center gap-3 cursor-pointer">
                <img src={assets.file_upload_icon} alt="Upload" className="p-3 bg-blue-500 rounded shadow" />
                <input type="file" id="thumbnailImage" onChange={e => setImage(e.target.files[0])} accept="image/*" hidden />
                {image && <img className="max-h-14 rounded shadow" src={URL.createObjectURL(image)} alt="thumbnail preview" />}
                {!image && <span className="text-gray-400">No file chosen</span>}
              </label>
            </div>
          </div>
          {/* Discount */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Discount %</label>
            <input onChange={e => setDiscount(e.target.value)} value={discount} type="number" placeholder="0" min={0} max={100} className="outline-none py-3 px-4 rounded-lg border border-gray-300 focus:border-blue-400 w-32 text-lg" required />
          </div>
          {/* Chapters & Lectures */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-blue-700">Course Structure</h2>
              <button type="button" onClick={() => handleChapter('add')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition">+ Add Chapter</button>
            </div>
            <div className="space-y-4">
              {chapters.map((chapter, chapterIndex) => (
                <div key={chapter.chapterId} className="bg-white border rounded-lg shadow-sm">
                  <div className="flex justify-between items-center p-4 border-b">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleChapter('toggle', chapter.chapterId)} className="focus:outline-none">
                        <img src={assets.dropdown_icon} width={18} alt="toggle" className={`transition-transform ${chapter.collapsed ? 'rotate-90' : ''}`} />
                      </button>
                      <span className="font-semibold text-gray-800">{chapterIndex + 1}. {chapter.chapterTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{chapter.chapterContent.length} lectures</span>
                      <button type="button" onClick={() => handleChapter('remove', chapter.chapterId)} className="hover:bg-red-100 p-1 rounded">
                        <img src={assets.cross_icon} alt="Remove" width={18} />
                      </button>
                    </div>
                  </div>
                  {!chapter.collapsed && (
                    <div className="p-4 space-y-2">
                      {chapter.chapterContent.map((lecture, lectureIndex) => (
                        <div key={lecture.lectureId} className="flex justify-between items-center bg-gray-50 rounded px-3 py-2">
                          <span className="text-gray-700">{lectureIndex + 1}. {lecture.lectureTitle} - {lecture.lectureDuration} mins - <a href={lecture.lectureUrl} target="_blank" className="text-blue-500 underline">Link</a> - {lecture.isPreviewFree ? <span className="text-green-600 font-medium">Free Preview</span> : <span className="text-gray-400">Paid</span>}</span>
                          <button type="button" onClick={() => handleLecture('remove', chapter.chapterId, lectureIndex)} className="hover:bg-red-100 p-1 rounded">
                            <img src={assets.cross_icon} alt="Remove" width={16} />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => handleLecture('add', chapter.chapterId)} className="inline-flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded mt-2 font-medium transition">
                        + Add Lecture
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {chapters.length === 0 && <div className="text-gray-400 text-center py-4">No chapters added yet.</div>}
            </div>
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3 rounded-lg font-bold text-lg shadow-lg transition flex items-center justify-center gap-2 ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
          >
            {saving ? (
              <>
                <LoadingSpinner size="h-5 w-5" color="text-white" />
                Creating...
              </>
            ) : 'Create Course'}
          </button>
        </form>
      </div>
      {/* Dialog Add Chapter */}
      {showChapterDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative animate-scaleIn">
            <button onClick={() => { setShowChapterDialog(false); setChapterTitle(''); }} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl">&times;</button>
            <h2 className="text-xl font-bold mb-4 text-blue-700">Add Chapter</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Chapter Name</label>
                <input
                  type="text"
                  className="block w-full border rounded py-2 px-3 outline-none focus:border-blue-400"
                  value={chapterTitle}
                  onChange={e => setChapterTitle(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addChapter()}
                  placeholder="Enter chapter name"
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
                  onClick={() => { setShowChapterDialog(false); setChapterTitle(''); }}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup Add Lecture */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative animate-scaleIn">
            <button onClick={() => setShowPopup(false)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl">&times;</button>
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

export default AddCourse
