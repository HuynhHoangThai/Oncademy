import React from 'react'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'
import { useClerk } from '@clerk/clerk-react'

const CallToAction = () => {
  const navigate = useNavigate()
  const { openSignIn } = useClerk()

  const handleGetStarted = () => {
    // Mở modal đăng nhập/đăng ký của Clerk
    openSignIn()
  }

  const handleLearnMore = () => {
    // Chuyển đến trang danh sách khóa học
    navigate('/course-list')
  }

  return (
    <div className='flex flex-col items-center gap-4 pt-10 pb-24 px-8 md:px-0'>
      <h1 className='md:text-4xl text-xl text-gray-800 font-semibold'>Learn anything, anytime, anywhere</h1>
      <p className='text-gray-500 sm:text-sm'>Incididunt sint fugiat pariatur cupidatat consectetur sit cillum anim id veniam aliqua proident excepteur commodo do ea.</p>
      <div className='flex items-center font-medium gap-6 mt-4'>
        <button 
          onClick={handleGetStarted}
          className='px-10 py-3 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg active:scale-95 transform duration-150'
        >
          Get started
        </button>
        <button 
          onClick={handleLearnMore}
          className='flex items-center gap-2 px-6 py-3 rounded-md border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors'
        >
          Learn more
          <img src={assets.arrow_icon} alt="arrow_icon" />
        </button>
      </div>
    </div>
  )
}

export default CallToAction