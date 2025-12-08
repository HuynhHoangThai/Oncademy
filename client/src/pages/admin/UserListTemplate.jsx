import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import UserTable from '../../components/admin/UserTable';
import { Navigate } from 'react-router-dom';

const ITEMS_PER_PAGE_OPTIONS = [1, 2, 5, 10];

const UserListTemplate = ({ role }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({
        isOpen: false,
        action: null,
        user: { id: null, name: null }
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[3]); // 💡 Mặc định là 10

    const pageTitle = role === 'educator' ? 'Educators' : 'Students';
    const endpoint = `/api/admin/users?role=${role}&limit=${itemsPerPage}&page=${currentPage}`;

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get(endpoint);

            setUsers(response.users || []);
            setTotalPages(response.totalPages || 0);
            setCurrentPage(response.currentPage || 1);
        } catch (error) {
            console.error(`Fetch ${pageTitle} error:`, error);
            toast.error(`Failed to fetch ${pageTitle} list.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [role, currentPage, itemsPerPage]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            Navigate(`?page=${page}`);
        }
    };

    const handleItemsPerPageChange = (event) => {
        const newLimit = parseInt(event.target.value);
        setItemsPerPage(newLimit);
        setCurrentPage(1); 
    };

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
                fetchUsers(); 
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">{pageTitle} ({users.length})</h1>

                <div className="flex items-center space-x-2">
                    <label htmlFor="items-per-page" className="text-sm text-gray-600">Show:</label>
                    <select
                        id="items-per-page"
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        className="py-1.5 px-3 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        {ITEMS_PER_PAGE_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
            </div>

            {users.length === 0 && totalPages === 0 ? (
                <div className="text-center py-10 text-gray-500">No active {pageTitle.toLowerCase()} found.</div>
            ) : (
                <UserTable
                    users={users}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    handleDemote={(userId, userName) => openModal('demote', userId, userName)}
                    role={role}
                />
            )}

            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                onConfirm={executeAction}
                title="Confirm Demotion"
                message={`Are you sure you want to demote ${modal.user.name} back to the Student role? This action will revoke their Educator privileges.`}
                confirmText="Demote"
                confirmColor="bg-red-600"
            />
        </div>
    );
};

export default UserListTemplate;