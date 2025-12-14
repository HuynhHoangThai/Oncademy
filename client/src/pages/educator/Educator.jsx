import React, { useContext, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import SideBar from '../../components/educator/SideBar'
import Navbar from '../../components/educator/Navbar'
import Footer from '../../components/educator/Footer'
import { AppContext } from '../../context/AppContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const Educator = () => {
    const { isEducator } = useContext(AppContext);
    const navigate = useNavigate();

    const NAVBAR_HEIGHT = 64;

    useEffect(() => {
        if (!isEducator) {
            navigate('/', { replace: true });
        }

    }, [isEducator, navigate]);

    if (!isEducator) {
        return <LoadingSpinner />;
    }

    return (
        <div className="text-default min-h-screen bg-white">
            <div
                className="sticky top-0 z-30 bg-white shadow-md border-b border-gray-100"
            >
                <Navbar />
            </div>
            <div className='flex'>
                <div
                    className='hidden lg:block flex-shrink-0'
                    style={{ width: '250px' }}
                >
                    <div
                        className="fixed bg-gray-50/90 overflow-y-auto"
                        style={{
                            top: `${NAVBAR_HEIGHT}px`,
                            height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
                            width: '250px' 
                        }}
                    >
                        <SideBar className="h-full" />
                    </div>
                </div>
                <div className='flex-1 min-w-0'>
                    <div className="pb-16" >
                        {<Outlet />}
                    </div>
                </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 z-[100] shadow-2xl h-16">
                <Footer />
            </div>
        </div>
    )
}

export default Educator