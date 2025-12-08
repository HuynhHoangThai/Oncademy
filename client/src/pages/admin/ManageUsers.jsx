import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const UserCard = ({ user, handleAction }) => {
    const isEducator = user.role === 'educator';
    return (
        <div key={user._id} className="p-4 border rounded-lg flex justify-between items-center bg-white shadow-sm hover:shadow-md transition">
            <div className='flex items-center space-x-3'>
                {/* 💡 Ảnh đại diện (nếu có) */}
                <img src={user.imageUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                    <p className="font-semibold text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                </div>
            </div>

            {isEducator && (
                <button
                    onClick={() => handleAction('demote', user._id, user.name)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                >
                    Demote to Student
                </button>
            )}
        </div>
    );
};


const ManageUsers = () => {
    const [educators, setEducators] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({
        isOpen: false,
        action: null, // 'demote'
        user: { id: null, name: null }
    });


    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Lấy danh sách Educator
            const educatorResponse = await api.get('/api/admin/users?role=educator');
            setEducators(educatorResponse.users || []);

            // Lấy danh sách Student
            const studentResponse = await api.get('/api/admin/users?role=student');
            setStudents(studentResponse.users || []);

        } catch (error) {
            console.error('Fetch users error:', error);
            toast.error('Failed to fetch user lists.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // 💡 Logic Modal và Hành động
    const openModal = (action, userId, userName) => {
        setModal({
            isOpen: true,
            action,
            user: { id: userId, name: userName }
        });
    };

    const closeModal = () => {
        setModal({ isOpen: false, action: null, user: { id: null, name: null } });
    };

    const executeAction = async () => {
        const { id: userId, name: userName } = modal.user;
        const { action } = modal;

        closeModal();

        try {
            if (action === 'demote') {
                await api.post('/api/admin/demote-educator', { userIdToDemote: userId });
                toast.success(`${userName} has been successfully demoted to Student.`);
            }

            fetchUsers(); // Tải lại danh sách

        } catch (error) {
            console.error(`${action} error:`, error);
            const errorMessage = error.message || `${action} failed. Check server logs.`;
            toast.error(`Error: ${errorMessage}`);
        }
    };


    if (loading) {
        return <div className="py-10"><LoadingSpinner size="h-10 w-10" /></div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Manage Users and Roles</h1>

            {/* --- Danh sách Educator --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">Educators ({educators.length})</h2>
                <div className="space-y-3">
                    {educators.length === 0 ? (
                        <p className="text-gray-500">No active educators found.</p>
                    ) : (
                        educators.map(user => (
                            <UserCard key={user._id} user={user} handleAction={openModal} />
                        ))
                    )}
                </div>
            </div>

            {/* --- Danh sách Student --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">Students ({students.length})</h2>
                <div className="space-y-3">
                    {students.length === 0 ? (
                        <p className="text-gray-500">No active students found.</p>
                    ) : (
                        students.map(user => (
                            <UserCard key={user._id} user={user} handleAction={openModal} />
                        ))
                    )}
                </div>
            </div>

            {/* 💡 MODAL HẠ CẤP */}
            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                onConfirm={executeAction}
                title="Confirm Demotion"
                message={`Are you sure you want to demote ${modal.user.name} back to the Student role? They will lose access to the Educator Dashboard.`}
                confirmText="Demote"
                confirmColor="bg-red-600"
            />
        </div>
    );
};

export default ManageUsers;