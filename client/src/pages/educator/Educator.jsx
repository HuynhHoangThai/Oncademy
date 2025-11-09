import React, { useContext, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import SideBar from '../../components/educator/SideBar'
import Navbar from '../../components/educator/Navbar'
import Footer from '../../components/educator/Footer'
import { AppContext } from '../../context/AppContext'

const Educator = () => {
    const { isEducator } = useContext(AppContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isEducator) {
            navigate('/');
        }
    }, [isEducator, navigate]);

    if (!isEducator) {
        return null; // or a loading component
    }

    return (
        <div className="text-default min-h-screen bg-white">
            <Navbar />
            <div className='flex'>
                <SideBar />
                <div className='flex-1'>
                    {<Outlet />}
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default Educator