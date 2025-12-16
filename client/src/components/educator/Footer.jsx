import React from 'react';
import { assets } from '../../assets/assets';
// import { Link } from 'react-router-dom';
const Footer = () => {
  return (
    <footer
      className="fixed bottom-0 left-0 w-full z-[100] 
                bg-gray-800 text-white shadow-2xl p-4 
                flex md:flex-row flex-col-reverse items-center justify-between border-t"
      style={{ height: '64px' }}
    >
      <div className='flex items-center gap-4'>
        <img className='hidden md:block w-20' src={assets.logo} alt="logo" />
        <div className='hidden md:block h-7 w-px bg-gray-500/60'></div>
        <p className="text-center text-xs md:text-sm text-gray-400">
          
        </p>
      </div>
      <div className='flex items-center gap-3 max-md:mt-4'>
        <a href="#">
          <img src={assets.facebook_icon} alt="facebook_icon" style={{ filter: 'brightness(0) invert(1)' }} />
        </a>
        <a href="#">
          <img src={assets.twitter_icon} alt="twitter_icon" style={{ filter: 'brightness(0) invert(1)' }} />
        </a>
        <a href="#">
          <img src={assets.instagram_icon} alt="instagram_icon" style={{ filter: 'brightness(0) invert(1)' }} />
        </a>
      </div>
    </footer>
  );
};

export default Footer;