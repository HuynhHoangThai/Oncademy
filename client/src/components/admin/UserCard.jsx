import React from 'react';
import { Link } from 'react-router-dom';

const UserCard = ({ user, handleAction }) => {
    // currentRole: 'educators' hoặc 'students' (dùng cho đường dẫn xem chi tiết)
    const isEducator = user.role === 'educator';

    return (
        <div
            key={user._id}
            className="p-4 border rounded-lg flex flex-col md:flex-row justify-between items-center bg-white shadow-sm hover:shadow-md transition duration-200"
        >
            {/* 💡 THÔNG TIN USER VÀ AVATAR */}
            <div className='flex items-center space-x-4 mb-3 md:mb-0'>
                <img
                    src={user.imageUrl || 'https://via.placeholder.com/50'}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-300"
                />
                <div>
                    <p className="font-semibold text-lg text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                </div>
            </div>

            {/* 💡 HÀNH ĐỘNG */}
            <div className="flex space-x-3">
                {/* Nút Xem chi tiết */}
                <Link
                    to={`/admin/users/${user.role}/${user._id}`} // Dùng role và _id để điều hướng
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                    View Details
                </Link>

                {/* Nút Hạ cấp (Chỉ hiển thị cho Educator) */}
                {isEducator && (
                    <button
                        onClick={() => handleAction('demote', user._id, user.name)}
                        className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
                    >
                        Demote to Student
                    </button>
                )}
            </div>
        </div>
    );
};

export default UserCard;