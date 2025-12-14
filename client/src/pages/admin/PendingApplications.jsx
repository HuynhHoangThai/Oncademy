import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { PartyPopper } from 'lucide-react';

const normalizeResumeUrl = (url) => {
    if (!url) return '#';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
    }
    return url;
};

const PendingApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectionReason, setRejectionReason] = useState('');

    const [modal, setModal] = useState({
        isOpen: false,
        action: null,
        user: { id: null, name: null }
    });

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/admin/applications/pending');
            setApplications(response.applications || []);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to fetch applications.');
            setApplications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const openModal = (action, userId, userName) => {
        setModal({
            isOpen: true,
            action,
            user: { id: userId, name: userName }
        });
        setRejectionReason('');
    };

    const closeModal = () => {
        setModal({ isOpen: false, action: null, user: { id: null, name: null } });
        setRejectionReason('');
    };

    const executeAction = async () => {
        const { id: userId, name: userName } = modal.user;
        const { action } = modal;

        if (action === 'reject' && !rejectionReason.trim()) {
            toast.warn('Please provide a rejection reason.');
            return;
        }

        closeModal();

        try {
            if (action === 'approve') {
                await api.post('/api/admin/approve-educator', { userIdToApprove: userId });
                toast.success(`${userName} has been successfully approved!`);
            } else if (action === 'reject') {
                await api.post('/api/admin/reject-educator', {
                    userIdToReject: userId,
                    rejectionReason: rejectionReason
                });
                toast.info(`${userName}'s application has been rejected.`);
            }

            fetchApplications();

        } catch (error) {
            console.error(`${action} error:`, error);
            const errorMessage = error.message || `${action} failed. Check server logs.`;
            toast.error(`Error: ${errorMessage}`);
        }
    };


    if (loading) {
        return <div className="text-center py-10">Loading applications...</div>;
    }

    return (
        <div className="p-4 bg-white rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Pending Educator Applications ({applications.length})</h1>

            {applications.length === 0 ? (
                <div className="text-center py-10 text-gray-500 flex items-center justify-center gap-2"><PartyPopper size={20} /> No pending applications at the moment!</div>
            ) : (
                <div className="space-y-4">
                    {applications.map((app) => (
                        <div key={app._id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 hover:bg-gray-100 transition duration-150">
                            <div className="mb-3 md:mb-0">
                                <p className="text-xl font-semibold text-gray-800 subpixel-antialiased"
                                    style={{
                                        fontFamily: 'Roboto, Inter, "Helvetica Neue", Arial, sans-serif'
                                    }}
                                >
                                    {app.name}
                                </p>
                                <p className="text-sm text-gray-500">{app.email}</p>
                            </div>
                            <div className="flex space-x-3">
                                <a
                                    href={normalizeResumeUrl(app.resume)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                                >
                                    Review CV
                                </a>

                                <button
                                    onClick={() => openModal('approve', app._id, app.name)}
                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    Approve
                                </button>

                                <button
                                    onClick={() => openModal('reject', app._id, app.name)}
                                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                onConfirm={executeAction}
                title={modal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                message={
                    <div className="flex flex-col gap-3">
                        <p>
                            {modal.action === 'approve'
                                ? `Are you sure you want to approve ${modal.user.name}? They will gain Educator access.`
                                : `Are you sure you want to reject ${modal.user.name}'s application?`
                            }
                        </p>

                        {modal.action === 'reject' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reason for rejection:
                                </label>
                                <textarea
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
                                    rows="3"
                                    placeholder="CV does not meet requirements..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    autoFocus
                                ></textarea>
                            </div>
                        )}
                    </div>
                }
                confirmText={modal.action === 'approve' ? 'Approve' : 'Reject'}
                confirmColor={modal.action === 'approve' ? 'bg-green-600' : 'bg-red-500'}
            />
        </div>
    );
};

export default PendingApplications;