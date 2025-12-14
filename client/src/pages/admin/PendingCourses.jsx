import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api'; // Axios instance đã cấu hình
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const PendingCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectionReason, setRejectionReason] = useState('');

    // State cho Modal xác nhận
    const [modal, setModal] = useState({
        isOpen: false,
        action: null, // 'approve' hoặc 'reject'
        course: { id: null, title: null }
    });

    // Hàm lấy danh sách khóa học chờ duyệt
    const fetchPendingCourses = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/admin/courses/pending');
            if (response.success) {
                setCourses(response.courses || []);
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            console.error('Fetch pending courses error:', error);
            toast.error('Failed to fetch pending courses.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingCourses();
    }, []);

    // Mở Modal
    const openModal = (action, courseId, courseTitle) => {
        setModal({
            isOpen: true,
            action,
            course: { id: courseId, title: courseTitle }
        });
        setRejectionReason('');
    };

    // Đóng Modal
    const closeModal = () => {
        setModal({ isOpen: false, action: null, course: { id: null, title: null } });
        setRejectionReason('');
    };

    // Thực hiện hành động khi bấm Confirm trong Modal
    const executeAction = async () => {
        const { id: courseId } = modal.course;
        const { action } = modal;

        if (action === 'reject' && !rejectionReason.trim()) {
            toast.error('Please provide a rejection reason.');
            return;
        }

        closeModal(); // Đóng modal trước

        try {
            let response;
            if (action === 'approve') {
                response = await api.post('/api/admin/courses/approve', { courseId });
                toast.success('Course approved and published successfully!');
            } else if (action === 'reject') {
                // Tương lai: Có thể thêm prompt nhập lý do từ chối
                response = await api.post('/api/admin/courses/reject', {
                    courseId,
                    rejectionReason
                });
                toast.info('Course has been rejected.');
            }

            // Load lại danh sách sau khi hành động thành công
            if (response && response.success) {
                fetchPendingCourses();
            }

        } catch (error) {
            console.error(`${action} error:`, error);
            toast.error(error.response?.data?.message || `${action} failed.`);
        }
    };

    if (loading) {
        return <div className="text-center py-10">Loading pending courses...</div>;
    }

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                Pending Course Approvals ({courses.length})
            </h1>

            {courses.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-lg flex items-center justify-center gap-2"><Sparkles size={20} /> No courses pending approval!</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {courses.map((course) => (
                        <div key={course._id} className="flex flex-col md:flex-row bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition duration-200">

                            {/* Thumbnail */}
                            <div className="md:w-48 h-32 md:h-auto flex-shrink-0 bg-gray-100">
                                <img
                                    src={course.courseThumbnail}
                                    alt={course.courseTitle}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Content */}
                            <div className="p-4 flex flex-col justify-between flex-grow">
                                <div>
                                    <div className='flex justify-between items-start'>
                                        <h3 className="text-xl font-semibold text-gray-800 mb-1">
                                            {course.courseTitle}
                                        </h3>
                                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                                            Pending
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-2">
                                        By: <span className="font-medium text-gray-800">{course.educator?.name || 'Unknown Educator'}</span>
                                    </p>

                                    <div className="text-sm text-gray-500 mb-4 line-clamp-2">
                                        {course.courseDescription.replace(/<[^>]+>/g, '') /* Loại bỏ thẻ HTML đơn giản để preview text */}
                                    </div>

                                    <div className="flex gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                            </svg>
                                            Price: <b>{course.coursePrice === 0 ? 'Free' : `$${course.coursePrice}`}</b>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                                <line x1="7" y1="7" x2="7.01" y2="7" />
                                            </svg>
                                            Discount: <b>{course.discount}%</b>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                            </svg>
                                            Chapters: <b>{course.courseContent?.length || 0}</b>
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-4 flex gap-3 justify-end items-center border-t pt-3">
                                    <Link
                                        to={`/course/${course._id}`}
                                        target="_blank"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-auto"
                                    >
                                        View Details ↗
                                    </Link>

                                    <button
                                        onClick={() => openModal('reject', course._id, course.courseTitle)}
                                        className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                    >
                                        Reject
                                    </button>

                                    <button
                                        onClick={() => openModal('approve', course._id, course.courseTitle)}
                                        className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition shadow-sm"
                                    >
                                        Approve & Publish
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Xác nhận */}
            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                onConfirm={executeAction}
                title={modal.action === 'approve' ? 'Approve Course' : 'Reject Course'}
                message={
                    <div>
                        <p className="mb-4">
                            {modal.action === 'approve'
                                ? `Are you sure you want to approve "${modal.course.title}"? It will be published immediately.`
                                : `Are you sure you want to reject "${modal.course.title}"?`
                            }
                        </p>

                        {modal.action === 'reject' && (
                            <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reason for rejection:
                                </label>
                                <textarea
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                                    rows="3"
                                    placeholder="Content violates copyright, Low audio quality..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
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

export default PendingCourses;