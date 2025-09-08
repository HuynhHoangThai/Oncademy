import { Routes, Route, useMatch } from 'react-router-dom'

// Student pages
import Home from './pages/students/Home'
import CourseList from './pages/students/CourseList'
import CourseDetailPage from './pages/students/CourseDetailPage'
import MyEnrollments from './pages/students/MyEnrollments'
import Player from './pages/students/Player'
import Favorites from './pages/students/Favorites'
import ViewHistory from './pages/students/ViewHistory'

// Educator pages
import Educator from './pages/educator/Educator'
import Dashboard from './pages/educator/Dashboard'
import AddCourse from './pages/educator/AddCourse'

import StudentsEnrolled from './pages/educator/StudentsEnrolled'
import Navbar from './components/students/NavBar'
import MyCourses from './pages/educator/MyCourses'

// Components
import Loading from './components/students/Loading'

const App = () => {
  const isEducatorRoute=useMatch('/educator/*')
  return (
    <div className='text-default min-h-screen '>
      {!isEducatorRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path='/course-list' element={<CourseList/>} />
        <Route path='/course-list/:input' element={<CourseList/>} />
        <Route path='/course/:id' element={<CourseDetailPage/>} />
        <Route path='/my-enrollments' element={<MyEnrollments/>} />
        <Route path='/favorites' element={<Favorites/>} />
        <Route path='/view-history' element={<ViewHistory/>} />
        <Route path='/player/:courseId' element={<Player/>} />
        <Route path='/loading/:path' element={<Loading/>} />
        <Route path='/educator' element={<Educator/>}>
          <Route index element={<Dashboard/>} />
          <Route path='add-course' element={<AddCourse/>} />
          <Route path='my-courses' element={<MyCourses/>} />
          <Route path='students-enrolled' element={<StudentsEnrolled/>} />
          <Route path='students-enrolled/:courseId' element={<StudentsEnrolled/>} />
          <Route path='student-enrolled' element={<StudentsEnrolled/>} />
          <Route path='student-enrolled/:courseId' element={<StudentsEnrolled/>} />
        </Route>
      </Routes>    
    </div>
  )
}
export default App
