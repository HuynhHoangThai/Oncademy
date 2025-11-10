import { Routes, Route, useMatch } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import {ToastContainer} from 'react-toastify'
import ErrorBoundary from './components/ErrorBoundary'

// Components
import Loading from './components/students/Loading'
import Navbar from './components/students/NavBar'

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/students/Home'))
const CourseList = lazy(() => import('./pages/students/CourseList'))
const CourseDetailPage = lazy(() => import('./pages/students/CourseDetailPage'))
const MyEnrollments = lazy(() => import('./pages/students/MyEnrollments'))
const Player = lazy(() => import('./pages/students/Player'))
const Favorites = lazy(() => import('./pages/students/Favorites'))
const ViewHistory = lazy(() => import('./pages/students/ViewHistory'))
const QuizTaking = lazy(() => import('./pages/students/QuizTaking'))
const QuizResult = lazy(() => import('./pages/students/QuizResult'))
const MyQuizResults = lazy(() => import('./pages/students/MyQuizResults'))

// Educator pages
const Educator = lazy(() => import('./pages/educator/Educator'))
const Dashboard = lazy(() => import('./pages/educator/Dashboard'))
const AddCourse = lazy(() => import('./pages/educator/AddCourse'))
const QuizManagement = lazy(() => import('./pages/educator/QuizManagement'))
const QuizBuilder = lazy(() => import('./pages/educator/QuizBuilder'))
const QuizSubmissions = lazy(() => import('./pages/educator/QuizSubmissions'))
const GradeQuiz = lazy(() => import('./pages/educator/GradeQuiz'))
const StudentsEnrolled = lazy(() => import('./pages/educator/StudentsEnrolled'))
const MyCourses = lazy(() => import('./pages/educator/MyCourses'))

const App = () => {
  const isEducatorRoute = useMatch('/educator/*');
  return (
    <ErrorBoundary>
    <div className='text-default min-h-screen '>
      {!isEducatorRoute && <Navbar />}
      <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path='/course-list' element={<CourseList />} />
        <Route path='/course-list/:input' element={<CourseList />} />
        <Route path='/course/:id' element={<CourseDetailPage />} />
        <Route path='/my-enrollments' element={<MyEnrollments />} />
        <Route path='/favorites' element={<Favorites />} />
        <Route path='/view-history' element={<ViewHistory />} />
        <Route path='/player/:courseId' element={<Player />} />
        <Route path='/quiz/:quizId' element={<QuizTaking />} />
        <Route path='/quiz/:quizId/result/:attemptId' element={<QuizResult />} />
        <Route path='/my-quiz-results' element={<MyQuizResults />} />
        <Route path='/loading/:path' element={<Loading />} />
        <Route path='/educator' element={<Educator />}>
          <Route index element={<Dashboard />} />
          <Route path='add-course' element={<AddCourse />} />
          <Route path='my-courses' element={<MyCourses />} />
          <Route path='quizzes' element={<QuizManagement />} />
          <Route path='quiz/create/:courseId' element={<QuizBuilder />} />
          <Route path='quiz/edit/:quizId' element={<QuizBuilder />} />
          <Route path='quiz/submissions/:quizId' element={<QuizSubmissions />} />
          <Route path='quiz/grade/:attemptId' element={<GradeQuiz />} />
          <Route path='students-enrolled' element={<StudentsEnrolled />} />
          <Route path='students-enrolled/:courseId' element={<StudentsEnrolled />} />
        </Route>
      </Routes>
      </Suspense>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
    </ErrorBoundary>
  );
}
export default App
