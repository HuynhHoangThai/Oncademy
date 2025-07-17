import { assets } from '../../assets/assets'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';

const NavBar = () => {
  const {isEducator} = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isCourseListPage = location.pathname.includes('/course-list');
  const {openSignIn} = useClerk();
  const { user } = useUser();
  
  return (
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 py-4 ${isCourseListPage ? 'bg-white' : 'bg-cyan-100/70'}`}>
      <Link to="/">
        <img src={assets.logo} alt="Logo" className="w-28 lg:w-32 cursor-pointer" />
      </Link>
      <div className=" hidden md:flex items-center gap-5 text-gray-600">
        <div className='flex items-center gap-5'>
        { user &&
        <>
          <button onClick={()=>{navigate('/educator')}} className="text-gray-600 hover:text-blue-600 transition duration-200 font-medium">{isEducator?'Educator Dashboard':'Become our Educator'}</button>
          <span className="text-gray-400">|</span>
          <Link to="/my-enrollments" className="text-gray-600 hover:text-blue-600 transition duration-200 font-medium">My Enrollments</Link>
          <span className="text-gray-400">|</span>
          <Link to="/favorites" className="text-gray-600 hover:text-blue-600 transition duration-200 font-medium flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            Favorites
          </Link>
          <span className="text-gray-400">|</span>
          <Link to="/view-history" className="text-gray-600 hover:text-blue-600 transition duration-200 font-medium flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </Link>
        </>
        }
          </div>
        {user ? <UserButton />:
        <button onClick={()=>openSignIn()} className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition duration-200 font-medium shadow-md">Create Account</button>}
      </div>
      <div className='md:hidden flex items-center gap-2 sm:gap-5 text-gray-500'> 
        <div className="flex items-center gap-3">
          { user &&
          <>
          <button className="text-gray-600 hover:text-blue-600 transition duration-200">Become Educator</button>
          <span className="text-gray-400">|</span>
          <Link to="/my-enrollments" className="text-gray-600 hover:text-blue-600 transition duration-200">Enrollments</Link>
          <span className="text-gray-400">|</span>
          <Link to="/favorites" className="text-gray-600 hover:text-blue-600 transition duration-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </Link>
          <Link to="/view-history" className="text-gray-600 hover:text-blue-600 transition duration-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Link>
          </>} 
          </div>
        <button className="p-2 hover:bg-gray-100 rounded-full transition duration-200">
          <img src={assets.user_icon} alt='User Profile' className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}

export default NavBar