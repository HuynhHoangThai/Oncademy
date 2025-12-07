import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
// 💡 Cần import Modal xác nhận của bạn
import ConfirmationModal from '../../components/common/ConfirmationModal';


const UserDetails = () => {
    const { role, userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 💡 STATE CHO MODAL HẠ CẤP
    const [isDemoteModalOpen, setIsDemoteModalOpen] = useState(false);


    const fetchDetails = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/admin/users/${userId}`);
            setUser(response.user);

            if (response.user.role !== role) {
                navigate(`/admin/users/${response.user.role}s/${userId}`, { replace: true });
            }

        } catch (error) {
            console.error('Fetch user details error:', error);
            toast.error('Failed to load user details.');
            // Quay về danh sách Educator (hoặc danh sách trước đó)
            navigate(`/admin/users/${role}s`, { replace: true });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchDetails();
        }
    }, [userId, navigate]);


    // 💡 HÀM XỬ LÝ HẠ CẤP
    const handleDemoteAction = async () => {
        setIsDemoteModalOpen(false); // Đóng modal ngay

        try {
            await api.post('/api/admin/demote-educator', { userIdToDemote: userId });

            toast.success(`${user.name} has been demoted to Student.`);

            // Điều hướng về danh sách Student sau khi hạ cấp thành công
            navigate('/admin/users/students', { replace: true });

        } catch (error) {
            console.error('Demote error:', error);
            toast.error(`Error demoting ${user.name}. Check server logs.`);
        }
    };


    if (loading) {
        return <div className="py-10 text-center"><LoadingSpinner size="h-10 w-10" /></div>;
    }

    if (!user) {
        return <div className="text-center p-6 text-red-500">User not found or failed to load.</div>;
    }

    const isEducator = user.role === 'educator';

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">

            {/* Nút Quay lại */}
            <button
                onClick={() => navigate(-1)}
                className="mb-4 text-blue-500 hover:text-blue-700 flex items-center"
            >
                &larr; Back to {isEducator ? 'Educators' : 'Students'} List
            </button>

            <div className="flex justify-between items-center border-b pb-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    {user.name} Details
                    <span className={`ml-3 text-sm font-semibold p-2 rounded-full ${isEducator ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                        {user.role.toUpperCase()}
                    </span>
                </h1>

                {/* 💡 NÚT HẠ CẤP CHO EDUCATOR */}
                {isEducator && (
                    <button
                        onClick={() => setIsDemoteModalOpen(true)}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-md"
                    >
                        Demote to Student
                    </button>
                )}
            </div>

            {/* --- Thông tin cơ bản --- */}
            <div className="grid grid-cols-2 gap-4 border-b pb-4 mb-4">
                <p className="text-gray-500">Email:</p>
                <p className="font-medium text-gray-700">{user.email}</p>

                <p className="text-gray-500">Member Since:</p>
                <p className="font-medium text-gray-700">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>

            {/* --- Chi tiết theo Vai trò --- */}
            {isEducator ? (
                // 💡 CHI TIẾT DÀNH CHO EDUCATOR
                <div className="mt-6">
                    <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Created Courses ({user.createdCourses?.length || 0})</h2>
                    <div className="space-y-3">
                        {user.createdCourses && user.createdCourses.length > 0 ? (
                            user.createdCourses.map(course => (
                                <div key={course._id} className="p-4 border rounded-lg bg-gray-50">
                                    <p className="font-semibold text-gray-800">{course.title}</p>
                                    <p className="text-sm text-gray-600">Price: ${course.price}</p>
                                    <p className={`text-xs font-medium ${course.published ? 'text-green-500' : 'text-red-500'}`}>
                                        {course.published ? 'Published' : 'Draft'}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">This educator has not created any courses yet.</p>
                        )}
                    </div>
                </div>
            ) : (
                // 💡 CHI TIẾT DÀNH CHO STUDENT
                <div className="mt-6">
                    <h2 className="text-2xl font-semibold mb-4 text-green-700">Enrolled Courses ({user.enrolledCourses?.length || 0})</h2>
                    <div className="space-y-3">
                        {user.enrolledCourses && user.enrolledCourses.length > 0 ? (
                            user.enrolledCourses.map(course => (
                                <div key={course._id} className="p-4 border rounded-lg bg-gray-50">
                                    <p className="font-semibold text-gray-800">{course.title}</p>
                                    <p className="text-sm text-gray-600">Price: ${course.price}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">This student has not enrolled in any courses yet.</p>
                        )}
                    </div>
                </div>
            )}

            {/* 💡 MODAL XÁC NHẬN HẠ CẤP */}
            <ConfirmationModal
                isOpen={isDemoteModalOpen}
                onClose={() => setIsDemoteModalOpen(false)}
                onConfirm={handleDemoteAction}
                title="Confirm Demotion"
                message={`Are you sure you want to demote ${user.name} back to the Student role? This action will revoke their Educator privileges and they will be listed as a Student.`}
                confirmText="Demote"
                confirmColor="bg-red-600"
            />
        </div>
    );
};

export default UserDetails;