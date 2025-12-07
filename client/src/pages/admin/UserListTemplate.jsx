import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import UserCard from '../../components/admin/UserCard'; // 💡 IMPORT CARD

const UserListTemplate = ({ role }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({
        isOpen: false,
        action: null,
        user: { id: null, name: null }
    });

    const pageTitle = role === 'educator' ? 'Educators' : 'Students';
    const endpoint = `/api/admin/users?role=${role}`;

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get(endpoint);
            setUsers(response.users || []);
        } catch (error) {
            console.error(`Fetch ${pageTitle} error:`, error);
            toast.error(`Failed to fetch ${pageTitle} list.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [role]);

    // 💡 LOGIC MODAL & HÀNH ĐỘNG
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

        if (action === 'demote') {
            try {
                await api.post('/api/admin/demote-educator', { userIdToDemote: userId });
                toast.success(`${userName} has been successfully demoted to Student.`);
                fetchUsers(); // Tải lại danh sách
            } catch (error) {
                console.error('Demote error:', error);
                toast.error(`Error demoting ${userName}. Check server logs.`);
            }
        }
    };

    if (loading) {
        return <div className="py-10 text-center"><LoadingSpinner size="h-10 w-10" /></div>;
    }

    return (
        <div className="p-4 bg-white rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">{pageTitle} ({users.length})</h1>

            {users.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No active {pageTitle.toLowerCase()} found.</div>
            ) : (
                <div className="space-y-4">
                    {users.map((user) => (
                        <UserCard
                            key={user._id}
                            user={user}
                            handleAction={openModal}
                            currentRole={role}
                        />
                    ))}
                </div>
            )}

            {/* MODAL HẠ CẤP */}
            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                onConfirm={executeAction}
                title="Confirm Demotion"
                message={`Are you sure you want to demote ${modal.user.name} back to the Student role? They will lose access to the Educator Dashboard and all created courses data will be frozen.`}
                confirmText="Demote"
                confirmColor="bg-red-600"
            />
        </div>
    );
};

export default UserListTemplate;