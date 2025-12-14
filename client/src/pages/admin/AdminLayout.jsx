import React, { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminLayout = () => {
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();

    // Khai báo chiều rộng Sidebar (Ví dụ: w-64 = 256px)
    const SIDEBAR_WIDTH = '256px';

    // 🛡️ Logic Bảo vệ Route Admin
    useEffect(() => {
        if (isLoaded) {
            const userRole = user?.publicMetadata?.role;

            if (!user || userRole !== 'admin') {
                navigate('/', { replace: true });
            }
        }
    }, [isLoaded, user, navigate]);

    if (!isLoaded || user?.publicMetadata?.role !== 'admin') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner size="h-12 w-12" color="text-gray-800" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-100">

            {/* 1. SIDEBAR (Cố định/Fixed) */}
            <div
                className="fixed top-0 left-0 h-screen bg-gray-800 shadow-xl z-20 hidden lg:block"
                style={{ width: SIDEBAR_WIDTH }}
            >
                <AdminSidebar />
            </div>

            {/* 2. NỘI DUNG CHÍNH (Content) */}
            {/* Thêm padding/margin bên trái để nhường chỗ cho Sidebar cố định */}
            <div
                className="flex-1 flex flex-col overflow-hidden"
                style={{ marginLeft: SIDEBAR_WIDTH }}
            >
                {/* 💡 Tùy chọn: Thêm AdminHeader nếu cần */}
                {/* <AdminHeader /> */}

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>

            {/* 💡 Sidebar cho Mobile: Bạn cần thêm logic ẩn/hiện Sidebar cho mobile nếu cần */}

        </div>
    );
};

export default AdminLayout;