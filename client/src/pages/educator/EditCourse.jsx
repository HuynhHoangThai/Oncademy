import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Uniqid from 'uniqid'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'react-toastify'
import Loading from '../../components/students/Loading'
import { AlertTriangle } from 'lucide-react';

const EditCourse = () => {
  const { id } = useParams()
  const quillRef = useRef(null)
  const editorRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [courseTitle, setCourseTitle] = useState('')
  const [coursePrice, setCoursePrice] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [image, setImage] = useState(null)
  const [existingThumbnail, setExistingThumbnail] = useState('')
  const [chapters, setChapters] = useState([])
  const [showPopup, setShowPopup] = useState(false)
  const [showChapterDialog, setShowChapterDialog] = useState(false)
  const [showEditChapterDialog, setShowEditChapterDialog] = useState(false)
  const [showEditLectureDialog, setShowEditLectureDialog] = useState(false)
  const [showDeleteChapterDialog, setShowDeleteChapterDialog] = useState(false)
  const [showDeleteLectureDialog, setShowDeleteLectureDialog] = useState(false)
  const [chapterTitle, setChapterTitle] = useState('')
  const [editingChapterId, setEditingChapterId] = useState(null)
  const [editingChapterTitle, setEditingChapterTitle] = useState('')
  const [editingLecture, setEditingLecture] = useState(null)
  const [deletingChapter, setDeletingChapter] = useState(null)
  const [deletingLecture, setDeletingLecture] = useState(null)
  const [currentChapterId, setCurrentChapterId] = useState(null)

  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: '',
    lectureDuration: 0,
    lectureUrl: '',
    isPreviewFree: false,
  })
  const [courseDescription, setCourseDescription] = useState('')
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const backendUrl = import.meta.env.VITE_BACKEND_URL

  // Fetch course data
  const fetchCourse = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/course/educator/edit/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        const course = data.courseData
        setCourseTitle(course.courseTitle || '')
        setCoursePrice(course.coursePrice || 0)
        setDiscount(course.discount || 0)
        setExistingThumbnail(course.courseThumbnail || '')
        setCourseDescription(course.courseDescription || '')
        setChapters(course.courseContent || [])
      } else {
        toast.error('Failed to load course')
        navigate('/educator/my-courses')
      }
    } catch (error) {
      console.error('Error fetching course:', error)
      toast.error('Failed to load course')
      navigate('/educator/my-courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourse()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Initialize Quill editor
  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
      })
      quillRef.current.on('text-change', () => {
        setCourseDescription(quillRef.current.root.innerHTML)
      })
    }
  }, [])

  // Set Quill content when description loads
  useEffect(() => {
    if (quillRef.current && courseDescription && !quillRef.current.getText().trim()) {
      quillRef.current.root.innerHTML = courseDescription
    }
  }, [courseDescription])

  const handleChapter = (action, chapterId) => {
    if (action === 'add') {
      setShowChapterDialog(true)
    } else if (action === 'remove') {
      const chapter = chapters.find(ch => ch.chapterId === chapterId)
      setDeletingChapter(chapter)
      setShowDeleteChapterDialog(true)
    } else if (action === 'toggle') {
      setChapters(
        chapters.map((chapter) =>
          chapter.chapterId === chapterId ? { ...chapter, collapsed: !chapter.collapsed } : chapter
        )
      )
    } else if (action === 'edit') {
      const chapter = chapters.find(ch => ch.chapterId === chapterId)
      setEditingChapterId(chapterId)
      setEditingChapterTitle(chapter.chapterTitle)
      setShowEditChapterDialog(true)
    }
  }

  const addChapter = () => {
    if (chapterTitle.trim()) {
      const newChapter = {
        chapterId: Uniqid(),
        chapterTitle: chapterTitle.trim(),
        chapterContent: [],
        collapsed: false,
        chapterOrder: chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
      }
      setChapters([...chapters, newChapter])
      setShowChapterDialog(false)
      setChapterTitle('')
    }
  }

  const updateChapter = () => {
    if (editingChapterTitle.trim()) {
      setChapters(
        chapters.map((chapter) =>
          chapter.chapterId === editingChapterId
            ? { ...chapter, chapterTitle: editingChapterTitle.trim() }
            : chapter
        )
      )
      setShowEditChapterDialog(false)
      setEditingChapterId(null)
      setEditingChapterTitle('')
    }
  }

  const confirmDeleteChapter = () => {
    setChapters(chapters.filter((chapter) => chapter.chapterId !== deletingChapter.chapterId))
    setShowDeleteChapterDialog(false)
    setDeletingChapter(null)
    toast.success('Chapter deleted')
  }

  const handleLecture = (action, chapterId, lectureIndex = null, lecture = null) => {
    if (action === 'add') {
      setCurrentChapterId(chapterId)
      setShowPopup(true)
    } else if (action === 'remove') {
      const chapter = chapters.find(ch => ch.chapterId === chapterId)
      setDeletingLecture({ chapterId, lectureIndex, lecture: chapter.chapterContent[lectureIndex] })
      setShowDeleteLectureDialog(true)
    } else if (action === 'edit') {
      setEditingLecture({ chapterId, lectureIndex, ...lecture })
      setShowEditLectureDialog(true)
    }
  }

  const addLecture = () => {
    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === currentChapterId) {
          const newLecture = {
            ...lectureDetails,
            lectureOrder: chapter.chapterContent.length > 0 ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1 : 1,
            lectureId: Uniqid()
          }
          chapter.chapterContent.push(newLecture)
        }
        return chapter
      })
    )
    setShowPopup(false)
    setLectureDetails({
      lectureTitle: '',
      lectureDuration: '',
      lectureUrl: '',
      isPreviewFree: false,
    })
  }

  const updateLecture = () => {
    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === editingLecture.chapterId) {
          chapter.chapterContent[editingLecture.lectureIndex] = {
            ...chapter.chapterContent[editingLecture.lectureIndex],
            lectureTitle: editingLecture.lectureTitle,
            lectureDuration: editingLecture.lectureDuration,
            lectureUrl: editingLecture.lectureUrl,
            isPreviewFree: editingLecture.isPreviewFree,
          }
        }
        return chapter
      })
    )
    setShowEditLectureDialog(false)
    setEditingLecture(null)
    toast.success('Lecture updated')
  }

  const confirmDeleteLecture = () => {
    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === deletingLecture.chapterId) {
          chapter.chapterContent.splice(deletingLecture.lectureIndex, 1)
        }
        return chapter
      })
    )
    setShowDeleteLectureDialog(false)
    setDeletingLecture(null)
    toast.success('Lecture deleted')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!courseTitle) return toast.error('Please provide a course title')

      setSaving(true)
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

      const { data } = await axios.put(`${backendUrl}/api/course/${id}`, form, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (data.success) {
        toast.success('Course updated successfully')
        navigate('/educator/my-courses')
      } else {
        toast.error(data.message || 'Failed to update course')
      }
    } catch (err) {
      console.error('EditCourse error', err)
      toast.error(err?.response?.data?.message || err.message || 'Server error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <form onSubmit={handleSubmit} className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-white flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">Edit Course</h1>
          <button
            type="button"
            onClick={() => navigate('/educator/my-courses')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
        </div>

        {/* Upload Image */}
        <div className="mb-6">
          <p className="mb-3 text-lg font-semibold text-gray-700">Upload Thumbnail</p>
          <label htmlFor="image" className="cursor-pointer">
            <img
              className="w-32 h-32 object-cover rounded-lg border-2 border-blue-200 hover:border-blue-400 transition"
              src={image ? URL.createObjectURL(image) : existingThumbnail || assets.upload_area}
              alt="Course Thumbnail"
            />
            <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
          </label>
        </div>

        {/* Course Title */}
        <div className="mb-6">
          <p className="mb-2 text-lg font-semibold text-gray-700">Course Title</p>
          <input
            onChange={(e) => setCourseTitle(e.target.value)}
            value={courseTitle}
            type="text"
            placeholder="Enter course title"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Course Description */}
        <div className="mb-6">
          <p className="mb-2 text-lg font-semibold text-gray-700">Course Description</p>
          <div ref={editorRef} className="border border-gray-300 rounded-lg min-h-[200px]"></div>
        </div>

        {/* Price & Discount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="mb-2 text-lg font-semibold text-gray-700">Course Price ($)</p>
            <input
              onChange={(e) => setCoursePrice(e.target.value)}
              value={coursePrice}
              type="number"
              placeholder="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <p className="mb-2 text-lg font-semibold text-gray-700">Discount (%)</p>
            <input
              onChange={(e) => setDiscount(e.target.value)}
              value={discount}
              type="number"
              placeholder="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Chapters & Lectures */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg font-semibold text-gray-700">Course Content</p>
            <button
              type="button"
              onClick={() => handleChapter('add')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2"
            >
              <img src={assets.add_icon} className="w-5 h-5" alt="" />
              Add Chapter
            </button>
          </div>

          {chapters.map((chapter) => (
            <div key={chapter.chapterId} className="mb-4 border border-gray-300 rounded-lg overflow-hidden">
              {/* Chapter Header */}
              <div className="flex items-center justify-between bg-blue-50 px-4 py-3">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    type="button"
                    onClick={() => handleChapter('toggle', chapter.chapterId)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <img
                      src={assets.dropdown_icon}
                      className={`w-5 h-5 transition-transform ${chapter.collapsed ? '-rotate-90' : ''}`}
                      alt=""
                    />
                  </button>
                  <h3 className="font-semibold text-gray-800">{chapter.chapterTitle}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleChapter('edit', chapter.chapterId)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                    title="Edit chapter"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChapter('remove', chapter.chapterId)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded"
                    title="Delete chapter"
                  >
                    <img src={assets.cross_icon} className="w-4 h-4" alt="" />
                  </button>
                </div>
              </div>

              {/* Lectures */}
              {!chapter.collapsed && (
                <div className="p-4 bg-white">
                  {chapter.chapterContent.map((lecture, lectureIndex) => (
                    <div key={lecture.lectureId} className="flex items-center justify-between p-3 mb-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{lecture.lectureTitle}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>Duration: {lecture.lectureDuration} min</span>
                          {lecture.isPreviewFree && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                              Free Preview
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLecture('edit', chapter.chapterId, lectureIndex, lecture)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                          title="Edit lecture"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLecture('remove', chapter.chapterId, lectureIndex)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded"
                          title="Delete lecture"
                        >
                          <img src={assets.cross_icon} className="w-4 h-4" alt="" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleLecture('add', chapter.chapterId)}
                    className="w-full py-2 mt-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition"
                  >
                    + Add Lecture
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className={`w-full py-3 rounded-lg font-semibold text-white transition ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Add Chapter Dialog */}
      {showChapterDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Chapter</h2>
            <input
              type="text"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addChapter()}
              placeholder="Enter chapter title"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowChapterDialog(false); setChapterTitle(''); }}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addChapter}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                Add Chapter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Chapter Dialog */}
      {showEditChapterDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Chapter</h2>
            <input
              type="text"
              value={editingChapterTitle}
              onChange={(e) => setEditingChapterTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && updateChapter()}
              placeholder="Enter chapter title"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowEditChapterDialog(false); setEditingChapterId(null); setEditingChapterTitle(''); }}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateChapter}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chapter Confirmation */}
      {showDeleteChapterDialog && deletingChapter && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Delete Chapter</h2>
            </div>
            <p className="text-gray-600 mb-3">Are you sure you want to delete this chapter?</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="font-semibold text-gray-800">{deletingChapter.chapterTitle}</p>
              <p className="text-sm text-gray-600">{deletingChapter.chapterContent.length} lecture(s)</p>
            </div>
            <p className="text-red-600 text-sm mb-4 font-medium flex items-center gap-1"><AlertTriangle size={16} /> Warning: This will delete all lectures in this chapter!</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowDeleteChapterDialog(false); setDeletingChapter(null); }}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteChapter}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
              >
                Delete Chapter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lecture Dialog */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Lecture</h2>

            <input
              type="text"
              placeholder="Lecture Title"
              value={lectureDetails.lectureTitle}
              onChange={(e) => setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            <input
              type="number"
              placeholder="Duration (minutes)"
              value={lectureDetails.lectureDuration}
              onChange={(e) => setLectureDetails({ ...lectureDetails, lectureDuration: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            <input
              type="text"
              placeholder="Video URL"
              value={lectureDetails.lectureUrl}
              onChange={(e) => setLectureDetails({ ...lectureDetails, lectureUrl: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={lectureDetails.isPreviewFree}
                onChange={(e) => setLectureDetails({ ...lectureDetails, isPreviewFree: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700">Free Preview</span>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPopup(false);
                  setLectureDetails({ lectureTitle: '', lectureDuration: '', lectureUrl: '', isPreviewFree: false });
                }}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addLecture}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                Add Lecture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lecture Dialog */}
      {showEditLectureDialog && editingLecture && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Lecture</h2>

            <input
              type="text"
              placeholder="Lecture Title"
              value={editingLecture.lectureTitle}
              onChange={(e) => setEditingLecture({ ...editingLecture, lectureTitle: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            <input
              type="number"
              placeholder="Duration (minutes)"
              value={editingLecture.lectureDuration}
              onChange={(e) => setEditingLecture({ ...editingLecture, lectureDuration: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            <input
              type="text"
              placeholder="Video URL"
              value={editingLecture.lectureUrl}
              onChange={(e) => setEditingLecture({ ...editingLecture, lectureUrl: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={editingLecture.isPreviewFree}
                onChange={(e) => setEditingLecture({ ...editingLecture, isPreviewFree: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700">Free Preview</span>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowEditLectureDialog(false); setEditingLecture(null); }}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateLecture}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Lecture Confirmation */}
      {showDeleteLectureDialog && deletingLecture && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Delete Lecture</h2>
            </div>
            <p className="text-gray-600 mb-3">Are you sure you want to delete this lecture?</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="font-semibold text-gray-800">{deletingLecture.lecture.lectureTitle}</p>
              <p className="text-sm text-gray-600">Duration: {deletingLecture.lecture.lectureDuration} min</p>
            </div>
            <p className="text-red-600 text-sm mb-4 font-medium flex items-center gap-1"><AlertTriangle size={16} /> Warning: This action cannot be undone!</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowDeleteLectureDialog(false); setDeletingLecture(null); }}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteLecture}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
              >
                Delete Lecture
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

export default EditCourse
