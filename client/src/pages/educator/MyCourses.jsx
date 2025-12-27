import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import Loading from '../../components/students/Loading';
import { AlertTriangle } from 'lucide-react';

const MyCourses = () => {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [pathways, setPathways] = useState([])
  const [viewMode, setViewMode] = useState('courses') // 'courses' or 'combos'
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [quizStats, setQuizStats] = useState({ totalAttempts: 0, avgScore: 0, passRate: 0 })
  const [studentAttempts, setStudentAttempts] = useState([])
  const [showStudentDetails, setShowStudentDetails] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [activeTab, setActiveTab] = useState('course') // 'course' or 'chapters'
  const [editForm, setEditForm] = useState({
    courseTitle: '',
    coursePrice: 0,
    discount: 0
  })
  const [chapters, setChapters] = useState([])
  const [updating, setUpdating] = useState(false)
  const [showAddChapterDialog, setShowAddChapterDialog] = useState(false)
  const [showEditChapterDialog, setShowEditChapterDialog] = useState(false)
  const [showDeleteChapterDialog, setShowDeleteChapterDialog] = useState(false)
  const [showAddLectureDialog, setShowAddLectureDialog] = useState(false)
  const [showEditLectureDialog, setShowEditLectureDialog] = useState(false)
  const [showDeleteLectureDialog, setShowDeleteLectureDialog] = useState(false)
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [editingChapterIndex, setEditingChapterIndex] = useState(null)
  const [editingChapterTitle, setEditingChapterTitle] = useState('')
  const [deletingChapterIndex, setDeletingChapterIndex] = useState(null)
  const [currentChapterIndex, setCurrentChapterIndex] = useState(null)
  const [lectureForm, setLectureForm] = useState({
    lectureTitle: '',
    lectureDuration: 0,
    lectureUrl: '',
    isPreviewFree: false
  })
  const [editingLectureIndex, setEditingLectureIndex] = useState(null)
  const [deletingLectureIndex, setDeletingLectureIndex] = useState(null)
  const currency = '$'
  const backendUrl = import.meta.env.VITE_BACKEND_URL

  // Fetch courses từ API
  const fetchCourses = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/educator/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  // Fetch pathways từ API
  const fetchPathways = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/pathway/educator/pathways`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        setPathways(data.pathways || [])
      }
    } catch (error) {
      console.error('Error fetching pathways:', error)
      toast.error('Failed to load combos')
    }
  }

  // Fetch quiz statistics
  const fetchQuizStats = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/quiz/stats/educator`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        setQuizStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching quiz stats:', error)
    }
  }

  // Fetch student quiz attempts
  const fetchStudentAttempts = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/quiz/stats/student-attempts`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        setStudentAttempts(data.studentAttempts || [])
      }
    } catch (error) {
      console.error('Error fetching student attempts:', error)
    }
  }

  // Sync dashboard để cập nhật số liệu chính xác
  const syncDashboard = async () => {
    try {
      setSyncing(true)
      const token = await getToken()
      await axios.post(`${backendUrl}/api/educator/dashboard/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Fetch lại courses sau khi sync
      await fetchCourses()
      toast.success('Data synced successfully')
    } catch (error) {
      console.error('Error syncing dashboard:', error)
      toast.error('Failed to sync data')
    } finally {
      setSyncing(false)
    }
  }

  // Open delete confirmation dialog
  const openDeleteDialog = (course) => {
    setCourseToDelete(course)
    setShowDeleteDialog(true)
  }

  // Close delete dialog
  const closeDeleteDialog = () => {
    setShowDeleteDialog(false)
    setCourseToDelete(null)
  }

  // Delete course
  const deleteCourse = async () => {
    if (!courseToDelete) return

    try {
      setDeleting(true)
      const token = await getToken()
      const { data } = await axios.delete(`${backendUrl}/api/course/${courseToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        toast.success('Course deleted successfully')
        setCourses(courses.filter(c => c._id !== courseToDelete._id))
        closeDeleteDialog()
      } else {
        toast.error(data.message || 'Failed to delete course')
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error(error?.response?.data?.message || 'Failed to delete course')
    } finally {
      setDeleting(false)
    }
  }

  // Open edit dialog
  const openEditDialog = (course) => {
    setEditingCourse(course)
    setEditForm({
      courseTitle: course.courseTitle,
      coursePrice: course.coursePrice || 0,
      discount: course.discount || 0
    })
    setChapters(course.courseContent || [])
    setActiveTab('course')
    setShowEditDialog(true)
  }

  // Close edit dialog
  const closeEditDialog = () => {
    setShowEditDialog(false)
    setEditingCourse(null)
    setEditForm({
      courseTitle: '',
      coursePrice: 0,
      discount: 0
    })
    setChapters([])
    setActiveTab('course')
  }

  // Update course
  const updateCourse = async () => {
    if (!editingCourse) return

    try {
      if (!editForm.courseTitle.trim()) {
        return toast.error('Course title is required')
      }

      setUpdating(true)
      const token = await getToken()

      const payload = {
        courseTitle: editForm.courseTitle,
        coursePrice: Number(editForm.coursePrice) || 0,
        discount: Number(editForm.discount) || 0,
        courseContent: chapters || []
      }

      const form = new FormData()
      form.append('courseData', JSON.stringify(payload))

      const { data } = await axios.put(`${backendUrl}/api/course/${editingCourse._id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        toast.success('Course updated successfully')
        // Update course in list
        setCourses(courses.map(c =>
          c._id === editingCourse._id
            ? { ...c, ...editForm, courseContent: chapters }
            : c
        ))
        closeEditDialog()
      } else {
        toast.error(data.message || 'Failed to update course')
      }
    } catch (error) {
      console.error('Error updating course:', error)
      toast.error(error?.response?.data?.message || 'Failed to update course')
    } finally {
      setUpdating(false)
    }
  }

  // Chapter handlers
  const handleAddChapter = () => {
    if (newChapterTitle.trim()) {
      const newChapter = {
        chapterId: `chapter_${Date.now()}`,
        chapterTitle: newChapterTitle.trim(),
        chapterContent: [], // Khởi tạo mảng rỗng
        chapterOrder: chapters.length + 1
      }
      setChapters([...chapters, newChapter])
      setNewChapterTitle('')
      setShowAddChapterDialog(false)
      toast.success('Chapter added')
    } else {
      toast.error('Please enter chapter title')
    }
  }

  const handleEditChapter = () => {
    if (editingChapterTitle.trim() && editingChapterIndex !== null) {
      const updatedChapters = [...chapters]
      updatedChapters[editingChapterIndex].chapterTitle = editingChapterTitle.trim()
      setChapters(updatedChapters)
      setEditingChapterIndex(null)
      setEditingChapterTitle('')
      setShowEditChapterDialog(false)
      toast.success('Chapter updated')
    } else if (!editingChapterTitle.trim()) {
      toast.error('Please enter chapter title')
    }
  }

  const handleDeleteChapter = () => {
    if (deletingChapterIndex !== null) {
      const updatedChapters = chapters.filter((_, index) => index !== deletingChapterIndex)
      setChapters(updatedChapters)
      setDeletingChapterIndex(null)
      setShowDeleteChapterDialog(false)
      toast.success('Chapter deleted')
    }
  }

  // Lecture handlers
  const handleAddLecture = () => {
    if (lectureForm.lectureTitle.trim() && currentChapterIndex !== null) {
      const updatedChapters = [...chapters]

      // Đảm bảo chapterContent tồn tại
      if (!updatedChapters[currentChapterIndex].chapterContent) {
        updatedChapters[currentChapterIndex].chapterContent = []
      }

      const newLecture = {
        lectureId: `lecture_${Date.now()}`,
        lectureTitle: lectureForm.lectureTitle.trim(),
        lectureDuration: Number(lectureForm.lectureDuration) || 0,
        lectureUrl: lectureForm.lectureUrl.trim(),
        isPreviewFree: lectureForm.isPreviewFree,
        lectureOrder: updatedChapters[currentChapterIndex].chapterContent.length + 1
      }
      updatedChapters[currentChapterIndex].chapterContent.push(newLecture)
      setChapters(updatedChapters)
      setLectureForm({ lectureTitle: '', lectureDuration: 0, lectureUrl: '', isPreviewFree: false })
      setCurrentChapterIndex(null)
      setShowAddLectureDialog(false)
      toast.success('Lecture added')
    } else if (!lectureForm.lectureTitle.trim()) {
      toast.error('Please enter lecture title')
    }
  }

  const handleEditLecture = () => {
    if (lectureForm.lectureTitle.trim() && currentChapterIndex !== null && editingLectureIndex !== null) {
      const updatedChapters = [...chapters]
      updatedChapters[currentChapterIndex].chapterContent[editingLectureIndex] = {
        ...updatedChapters[currentChapterIndex].chapterContent[editingLectureIndex],
        lectureTitle: lectureForm.lectureTitle.trim(),
        lectureDuration: Number(lectureForm.lectureDuration) || 0,
        lectureUrl: lectureForm.lectureUrl.trim(),
        isPreviewFree: lectureForm.isPreviewFree
      }
      setChapters(updatedChapters)
      setLectureForm({ lectureTitle: '', lectureDuration: 0, lectureUrl: '', isPreviewFree: false })
      setCurrentChapterIndex(null)
      setEditingLectureIndex(null)
      setShowEditLectureDialog(false)
      toast.success('Lecture updated')
    } else if (!lectureForm.lectureTitle.trim()) {
      toast.error('Please enter lecture title')
    }
  }

  const handleDeleteLecture = () => {
    if (currentChapterIndex !== null && deletingLectureIndex !== null) {
      const updatedChapters = [...chapters]
      updatedChapters[currentChapterIndex].chapterContent =
        updatedChapters[currentChapterIndex].chapterContent.filter((_, index) => index !== deletingLectureIndex)
      setChapters(updatedChapters)
      setCurrentChapterIndex(null)
      setDeletingLectureIndex(null)
      setShowDeleteLectureDialog(false)
      toast.success('Lecture deleted')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await fetchCourses()
      await fetchPathways()
      await fetchQuizStats()
      await fetchStudentAttempts()
    }

    loadData()

    // Auto-refresh khi tab visible và mỗi 5 phút
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <Loading />

  const handleTogglePublish = async (course) => {
    if (course.approvalStatus !== 'approved') {
      return toast.warn("Course must be approved by Admin before publishing.");
    }

    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/educator/toggle-publish`,
        { courseId: course._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setCourses(courses.map(c =>
          c._id === course._id ? { ...c, isPublished: data.isPublished } : c
        ));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Publish toggle error:", error);
      toast.error("Failed to update visibility.");
    }
  };

  // Handle course edit - navigate to edit page
  const handleEditCourse = (course) => {
    navigate(`/educator/edit-course/${course._id}`);
  };

  // Handle pathway toggle publish
  const handleTogglePublishPathway = async (pathway) => {
    if (pathway.approvalStatus !== 'approved') {
      return toast.warn("Combo must be approved by Admin before publishing.");
    }

    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/pathway/toggle-publish`,
        { pathwayId: pathway._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setPathways(pathways.map(p =>
          p._id === pathway._id ? { ...p, isPublished: data.isPublished } : p
        ));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Publish toggle error:", error);
      toast.error("Failed to update visibility.");
    }
  };

  // Handle pathway delete
  const handleDeletePathway = async (pathway) => {
    if (!window.confirm(`Are you sure you want to delete "${pathway.pathwayTitle}"?`)) {
      return;
    }

    try {
      const token = await getToken();
      const { data } = await axios.delete(
        `${backendUrl}/api/pathway/${pathway._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success('Combo deleted successfully');
        setPathways(pathways.filter(p => p._id !== pathway._id));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete combo.");
    }
  };

  // Handle pathway edit - navigate to edit page
  const handleEditPathway = (pathway) => {
    navigate(`/educator/edit-pathway/${pathway._id}`);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-white flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl flex flex-col gap-6">
        {/* Header with Sync Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-4">My Courses</h1>

            {/* Tab Switcher */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setViewMode('courses')}
                className={`px-4 sm:px-6 py-2 rounded-md font-medium transition-all text-sm sm:text-base ${viewMode === 'courses'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-transparent text-gray-600 hover:text-gray-800'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="hidden sm:inline">Courses</span>
                  <span className="sm:hidden">Courses</span>
                  <span>({courses.length})</span>
                </div>
              </button>

              <button
                onClick={() => setViewMode('combos')}
                className={`px-4 sm:px-6 py-2 rounded-md font-medium transition-all text-sm sm:text-base ${viewMode === 'combos'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                  : 'bg-transparent text-gray-600 hover:text-gray-800'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                  <span className="hidden sm:inline">Course Combos</span>

                  <span>({pathways.length})</span>
                </div>
              </button>
            </div>
          </div>
          <button
            onClick={syncDashboard}
            disabled={syncing}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all w-full sm:w-auto ${syncing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
          >
            {syncing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing...
              </span>
            ) : (
              'Sync Data'
            )}
          </button>
        </div>

        {/* Courses/Combos Table */}
        <div className={`bg-white rounded-2xl shadow-xl p-4 sm:p-6 overflow-x-auto ${viewMode === 'combos' ? 'border-2 border-teal-200' : 'border border-gray-200'
          }`}>
          {viewMode === 'courses' ? (
            // COURSES TABLE
            courses.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="mt-4 text-gray-500 text-lg font-medium">No courses yet</p>
                <p className="text-gray-400 text-sm mb-6">Create your first course to get started</p>
                <button
                  onClick={() => window.location.href = '/educator/add-course'}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Create Course
                </button>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-blue-50 text-blue-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-left">Course</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                    <th className="px-4 py-3 font-semibold text-center hidden md:table-cell">Price</th>
                    <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">Students</th>
                    <th className="px-4 py-3 font-semibold text-center hidden lg:table-cell">Quizzes</th>
                    <th className="px-4 py-3 font-semibold text-center hidden xl:table-cell">Published On</th>
                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                    <th className="px-4 py-3 font-semibold text-center">Visibility</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {courses.map((course) => {
                    const students = Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0
                    const price = Number(course.coursePrice || 0)
                    const discount = Number(course.discount || 0)
                    const finalPrice = price - (discount * price) / 100
                    const quizCount = course.quizCount || 0

                    return (
                      <tr key={course._id} className="border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition">
                        <td className="px-4 py-3 min-w-[220px]">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <img
                              src={course.courseThumbnail}
                              alt={course.courseTitle}
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover border-2 border-blue-200 shadow flex-shrink-0"
                            />
                            <span className="truncate font-semibold text-sm sm:text-base lg:text-lg">{course.courseTitle}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {course.isPublished ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              Published
                            </span>
                          ) : course.approvalStatus === 'rejected' ? (
                            <div className="flex flex-col items-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 mb-1">
                                Rejected
                              </span>
                              {/* Hiển thị lý do từ chối nếu có (Tooltip khi hover) */}
                              {course.rejectionReason && (
                                <div className="group relative cursor-help">
                                  <span className="text-[14px] text-red-600 underline decoration-dotted">Why?</span>
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    {course.rejectionReason}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-medium hidden md:table-cell">
                          {discount > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className="line-through text-gray-400 text-xs">{currency}{price}</span>
                              <span className="text-blue-700 font-bold">{currency}{finalPrice.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="font-bold text-blue-700">{currency}{price}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {students}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            {quizCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500 text-xs sm:text-sm hidden xl:table-cell">
                          {new Date(course.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditCourse(course)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 rounded-lg font-medium transition-colors text-sm"
                              title="Edit course"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => openDeleteDialog(course)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 rounded-lg font-medium transition-colors text-sm"
                              title="Delete course"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {course.approvalStatus === 'approved' ? (
                            <button
                              onClick={() => handleTogglePublish(course)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${course.isPublished ? 'bg-green-600' : 'bg-gray-300'
                                }`}
                              title={course.isPublished ? "Click to Unpublish" : "Click to Publish"}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${course.isPublished ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                              />
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              {course.approvalStatus === 'pending' ? 'Reviewing' : 'Restricted'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          ) : (
            // COMBOS TABLE
            pathways.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-teal-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                <p className="mt-4 text-gray-500 text-lg font-medium">No course combos yet</p>
                <p className="text-gray-400 text-sm mb-6">Create your first combo to get started</p>
                <button
                  onClick={() => window.location.href = '/educator/add-pathway'}
                  className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-colors"
                >
                  Create Course Combo
                </button>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-left">Course Combo</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                    <th className="px-4 py-3 font-semibold text-center hidden md:table-cell">Price</th>
                    <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">Students</th>
                    <th className="px-4 py-3 font-semibold text-center hidden lg:table-cell">Phases</th>
                    <th className="px-4 py-3 font-semibold text-center hidden xl:table-cell">Created</th>
                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                    <th className="px-4 py-3 font-semibold text-center">Visibility</th>
                  </tr>
                </thead>
                <tbody>
                  {pathways.map((pathway) => {
                    const price = pathway.pathwayPrice || 0
                    const discount = pathway.discount || 0
                    const finalPrice = price - (price * discount / 100)
                    const students = Array.isArray(pathway.enrolledStudents) ? pathway.enrolledStudents.length : 0
                    const phases = pathway.phases?.length || 0

                    const statusConfig = {
                      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
                      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
                      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' }
                    }
                    const status = statusConfig[pathway.approvalStatus] || statusConfig.pending

                    return (
                      <tr key={pathway._id} className="border-b border-gray-100 hover:bg-teal-50/30 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <img
                                src={pathway.pathwayThumbnail || '/placeholder.jpg'}
                                alt={pathway.pathwayTitle}
                                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg shadow-md border-2 border-teal-200"
                              />
                              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                COMBO
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{pathway.pathwayTitle}</h3>
                              <p className="text-xs text-gray-500">{phases} phase{phases !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-medium hidden md:table-cell">
                          {discount > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className="line-through text-gray-400 text-xs">{currency}{price}</span>
                              <span className="text-teal-700 font-bold">{currency}{finalPrice.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="font-bold text-teal-700">{currency}{price}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800">
                            {students}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                            {phases}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500 text-xs sm:text-sm hidden xl:table-cell">
                          {new Date(pathway.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditPathway(pathway)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-100 hover:bg-teal-200 text-teal-700 hover:text-teal-800 rounded-lg font-medium transition-colors text-sm"
                              title="Edit combo"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeletePathway(pathway)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 rounded-lg font-medium transition-colors text-sm"
                              title="Delete combo"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {pathway.approvalStatus === 'approved' ? (
                            <button
                              onClick={() => handleTogglePublishPathway(pathway)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pathway.isPublished ? 'bg-teal-600' : 'bg-gray-300'
                                }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pathway.isPublished ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Reviewing</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          )}
        </div>



        {/* Student Quiz Attempts Section */}
        {studentAttempts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-700">Student Quiz Performance</h2>
              <button
                onClick={() => setShowStudentDetails(!showStudentDetails)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                {showStudentDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentAttempts.slice(0, showStudentDetails ? undefined : 6).map((student) => (
                <div
                  key={student.studentId}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200 hover:shadow-lg transition-shadow"
                >
                  {/* Student Header */}
                  <div className="flex items-center gap-3 mb-4">
                    {student.studentImage ? (
                      <img
                        src={student.studentImage}
                        alt={student.studentName}
                        className="w-12 h-12 rounded-full border-2 border-blue-300 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {student.studentName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{student.studentName}</h3>
                      <p className="text-xs text-gray-500 truncate">{student.studentEmail}</p>
                    </div>
                  </div>

                  {/* Statistics Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Attempts</p>
                      <p className="text-lg font-bold text-purple-600">{student.totalAttempts}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Avg Score</p>
                      <p className="text-lg font-bold text-blue-600">{student.avgScore.toFixed(1)}%</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Best Score</p>
                      <p className="text-lg font-bold text-green-600">{student.bestScore.toFixed(1)}%</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Passed</p>
                      <p className="text-lg font-bold text-emerald-600">{student.passedCount}/{student.totalAttempts}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Overall Progress</span>
                      <span className="text-xs font-semibold text-gray-700">{student.avgScore.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${student.avgScore >= 80 ? 'bg-green-500' :
                          student.avgScore >= 60 ? 'bg-blue-500' :
                            student.avgScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${Math.min(student.avgScore, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Last Attempt */}
                  {student.lastAttemptDate && (
                    <div className="text-xs text-gray-500 text-center mt-2">
                      Last attempt: {new Date(student.lastAttemptDate).toLocaleDateString()}
                    </div>
                  )}

                  {/* Recent Attempts Details (if expanded) */}
                  {showStudentDetails && student.attempts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Recent Attempts:</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {student.attempts.slice(0, 5).map((attempt) => (
                          <div key={attempt.attemptId} className="bg-white rounded-lg p-2 text-xs">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-gray-700 truncate flex-1">{attempt.quizTitle}</span>
                              <span className={`ml-2 font-bold ${attempt.score >= 80 ? 'text-green-600' :
                                attempt.score >= 60 ? 'text-blue-600' :
                                  attempt.score >= 40 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                {attempt.score.toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-gray-500">
                              <span>{new Date(attempt.submittedAt).toLocaleDateString()}</span>
                              <span className={`px-2 py-0.5 rounded ${attempt.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {attempt.passed ? 'Passed' : 'Failed'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!showStudentDetails && studentAttempts.length > 6 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setShowStudentDetails(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  View all {studentAttempts.length} students →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && courseToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Delete Course</h2>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-3">Are you sure you want to delete this course?</p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-semibold text-gray-800 mb-1">{courseToDelete.courseTitle}</p>
                <p className="text-sm text-gray-600">
                  {Array.isArray(courseToDelete.enrolledStudents) ? courseToDelete.enrolledStudents.length : 0} student(s) enrolled
                </p>
              </div>
              <p className="text-red-600 text-sm mt-3 font-medium flex items-center gap-1"><AlertTriangle size={16} /> Warning: This action cannot be undone!</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeDeleteDialog}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteCourse}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Course
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Dialog */}
      {showEditDialog && editingCourse && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Edit Course</h2>
              </div>
              <button
                onClick={closeEditDialog}
                disabled={updating}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('course')}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'course'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Course Info
                </div>
              </button>
              <button
                onClick={() => setActiveTab('chapters')}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'chapters'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Chapters ({chapters.length})
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {activeTab === 'course' ? (
                <>
                  {/* Course Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Course Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.courseTitle}
                      onChange={(e) => setEditForm({ ...editForm, courseTitle: e.target.value })}
                      placeholder="Enter course title"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={updating}
                    />
                  </div>

                  {/* Course Price */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Course Price ($)
                    </label>
                    <input
                      type="number"
                      value={editForm.coursePrice}
                      onChange={(e) => setEditForm({ ...editForm, coursePrice: e.target.value })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={updating}
                    />
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      value={editForm.discount}
                      onChange={(e) => setEditForm({ ...editForm, discount: e.target.value })}
                      placeholder="0"
                      min="0"
                      max="100"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={updating}
                    />
                  </div>

                  {/* Preview of pricing */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Price Preview:</p>
                    {editForm.discount > 0 ? (
                      <div className="flex items-center gap-3">
                        <span className="text-lg line-through text-gray-400">{currency}{editForm.coursePrice}</span>
                        <span className="text-2xl font-bold text-blue-700">
                          {currency}{(editForm.coursePrice - (editForm.discount * editForm.coursePrice) / 100).toFixed(2)}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                          {editForm.discount}% OFF
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-blue-700">{currency}{editForm.coursePrice}</span>
                    )}
                  </div>

                  {/* Current course info */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Current Course Info:</p>
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={editingCourse.courseThumbnail}
                        alt={editingCourse.courseTitle}
                        className="w-16 h-16 rounded-lg object-cover border-2 border-gray-300"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{editingCourse.courseTitle}</p>
                        <p className="text-xs text-gray-600">
                          {editingCourse.courseContent?.length || 0} chapters •
                          {editingCourse.enrolledStudents?.length || 0} students enrolled
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Chapters Tab Content */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Course Chapters</p>
                    <button
                      onClick={() => setShowAddChapterDialog(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Chapter
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {chapters.length === 0 ? (
                      <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 text-sm mb-2">No chapters yet</p>
                        <button
                          onClick={() => setShowAddChapterDialog(true)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          + Add your first chapter
                        </button>
                      </div>
                    ) : (
                      chapters.map((chapter, index) => (
                        <div key={chapter.chapterId || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                                {index + 1}
                              </span>
                              <h4 className="font-semibold text-gray-800">{chapter.chapterTitle}</h4>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingChapterIndex(index)
                                  setEditingChapterTitle(chapter.chapterTitle)
                                  setShowEditChapterDialog(true)
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                                title="Edit chapter"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingChapterIndex(index)
                                  setShowDeleteChapterDialog(true)
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                                title="Delete chapter"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <div className="ml-8 space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-gray-600">
                                {chapter.chapterContent?.length || 0} lecture(s)
                              </p>
                              <button
                                onClick={() => {
                                  setCurrentChapterIndex(index)
                                  setShowAddLectureDialog(true)
                                }}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Lecture
                              </button>
                            </div>

                            {chapter.chapterContent && chapter.chapterContent.length > 0 && (
                              <div className="space-y-1">
                                {chapter.chapterContent.map((lecture, lectureIndex) => (
                                  <div key={lecture.lectureId || lectureIndex} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                    <div className="flex items-center gap-2 text-xs text-gray-600 flex-1">
                                      <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="flex-1">{lecture.lectureTitle}</span>
                                      <span className="text-gray-400">• {lecture.lectureDuration} min</span>
                                      {lecture.isPreviewFree && (
                                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium">
                                          Free
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                      <button
                                        onClick={() => {
                                          setCurrentChapterIndex(index)
                                          setEditingLectureIndex(lectureIndex)
                                          setLectureForm({
                                            lectureTitle: lecture.lectureTitle,
                                            lectureDuration: lecture.lectureDuration,
                                            lectureUrl: lecture.lectureUrl,
                                            isPreviewFree: lecture.isPreviewFree
                                          })
                                          setShowEditLectureDialog(true)
                                        }}
                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                        title="Edit lecture"
                                      >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setCurrentChapterIndex(index)
                                          setDeletingLectureIndex(lectureIndex)
                                          setShowDeleteLectureDialog(true)
                                        }}
                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                        title="Delete lecture"
                                      >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeEditDialog}
                disabled={updating}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateCourse}
                disabled={updating}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Chapter Dialog */}
      {showAddChapterDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-[60] animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Chapter</h3>
            <input
              type="text"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddChapter()}
              placeholder="Enter chapter title"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAddChapterDialog(false); setNewChapterTitle(''); }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddChapter}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
              >
                Add Chapter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Chapter Dialog */}
      {showEditChapterDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-[60] animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Chapter</h3>
            <input
              type="text"
              value={editingChapterTitle}
              onChange={(e) => setEditingChapterTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEditChapter()}
              placeholder="Enter chapter title"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowEditChapterDialog(false); setEditingChapterIndex(null); setEditingChapterTitle(''); }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEditChapter}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chapter Dialog */}
      {showDeleteChapterDialog && deletingChapterIndex !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-[60] animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Delete Chapter</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{chapters[deletingChapterIndex]?.chapterTitle}"?
              This will also delete all {chapters[deletingChapterIndex]?.chapterContent?.length || 0} lecture(s) in this chapter.
            </p>
            <p className="text-red-600 text-sm mb-4 font-medium flex items-center gap-1"><AlertTriangle size={16} /> Warning: This action cannot be undone!</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteChapterDialog(false); setDeletingChapterIndex(null); }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChapter}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
              >
                Delete Chapter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lecture Dialog */}
      {showAddLectureDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-[60] animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Lecture</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={lectureForm.lectureTitle}
                onChange={(e) => setLectureForm({ ...lectureForm, lectureTitle: e.target.value })}
                placeholder="Lecture Title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                value={lectureForm.lectureDuration}
                onChange={(e) => setLectureForm({ ...lectureForm, lectureDuration: e.target.value })}
                placeholder="Duration (minutes)"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={lectureForm.lectureUrl}
                onChange={(e) => setLectureForm({ ...lectureForm, lectureUrl: e.target.value })}
                placeholder="Video URL"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lectureForm.isPreviewFree}
                  onChange={(e) => setLectureForm({ ...lectureForm, isPreviewFree: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Free Preview</span>
              </label>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowAddLectureDialog(false);
                  setCurrentChapterIndex(null);
                  setLectureForm({ lectureTitle: '', lectureDuration: 0, lectureUrl: '', isPreviewFree: false });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLecture}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
              >
                Add Lecture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lecture Dialog */}
      {showEditLectureDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-[60] animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Lecture</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={lectureForm.lectureTitle}
                onChange={(e) => setLectureForm({ ...lectureForm, lectureTitle: e.target.value })}
                placeholder="Lecture Title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                value={lectureForm.lectureDuration}
                onChange={(e) => setLectureForm({ ...lectureForm, lectureDuration: e.target.value })}
                placeholder="Duration (minutes)"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={lectureForm.lectureUrl}
                onChange={(e) => setLectureForm({ ...lectureForm, lectureUrl: e.target.value })}
                placeholder="Video URL"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lectureForm.isPreviewFree}
                  onChange={(e) => setLectureForm({ ...lectureForm, isPreviewFree: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Free Preview</span>
              </label>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowEditLectureDialog(false);
                  setCurrentChapterIndex(null);
                  setEditingLectureIndex(null);
                  setLectureForm({ lectureTitle: '', lectureDuration: 0, lectureUrl: '', isPreviewFree: false });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEditLecture}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Lecture Dialog */}
      {showDeleteLectureDialog && currentChapterIndex !== null && deletingLectureIndex !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-[60] animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Delete Lecture</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{chapters[currentChapterIndex]?.chapterContent[deletingLectureIndex]?.lectureTitle}"?
            </p>
            <p className="text-red-600 text-sm mb-4 font-medium flex items-center gap-1"><AlertTriangle size={16} /> Warning: This action cannot be undone!</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteLectureDialog(false);
                  setCurrentChapterIndex(null);
                  setDeletingLectureIndex(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLecture}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
              >
                Delete Lecture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyCourses
