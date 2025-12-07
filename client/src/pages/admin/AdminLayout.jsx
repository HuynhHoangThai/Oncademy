import React, { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar'; // Cần tạo
import LoadingSpinner from '../../components/common/LoadingSpinner';
// import AdminHeader from '../../components/admin/AdminHeader'; // Cần tạo

const AdminLayout = () => {
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();

    // 🛡️ Logic Bảo vệ Route Admin
    useEffect(() => {
        if (isLoaded) {
            const userRole = user?.publicMetadata?.role;

            // Nếu không phải Admin, chuyển hướng ra ngoài (Ví dụ: về trang chủ)
            if (!user || userRole !== 'admin') {
                navigate('/', { replace: true });
                // Tùy chọn: toast.error('Access denied. Admin privileges required.');
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
            {/* Thanh Sidebar Admin */}
            <AdminSidebar />

            {/* Nội dung chính */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* <AdminHeader /> */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
                    {/* Component con sẽ được render ở đây (Outlet) */}
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;