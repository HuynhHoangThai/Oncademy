import React from 'react';
import { Link } from 'react-router-dom';
import { FaEdit } from 'react-icons/fa';

const UserTable = ({ users, totalPages, currentPage, onPageChange, handleDemote }) => {

    // Hàm tạo mảng số trang
    const getPageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member Since</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                        <tr key={user._id}>
                            {/* Cột User (Tên + Email) */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <img
                                        className="h-10 w-10 rounded-full mr-4 object-cover"
                                        src={user.imageUrl || 'https://via.placeholder.com/50'}
                                        alt={user.name}
                                    />
                                    <div>
                                        <Link
                                            to={`/admin/users/${user.role}/${user._id}`}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                            {user.name}
                                        </Link>

                                        {user.isAccountBanned && (
                                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                                BANNED
                                            </span>
                                        )}
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            {/* Cột Role */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${user.role === 'educator' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                                    {user.role.toUpperCase()}
                                </span>
                            </td>
                            {/* Cột Member Since */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            {/* Cột Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                {/* Nút Demote (Chỉ hiển thị cho Educator) */}
                                {user.role === 'educator' && (
                                    <button
                                        onClick={() => handleDemote(user._id, user.name)}
                                        className="text-red-600 hover:text-red-900 transition duration-150"
                                        title="Demote to Student"
                                    >
                                        Demote
                                    </button>
                                )}
                                {/* Nút View Details (Sử dụng icon Edit để tượng trưng) */}
                                <Link
                                    to={`/admin/users/${user.role}/${user._id}`}
                                    className="text-gray-400 hover:text-gray-600 transition duration-150"
                                    title="View Details"
                                >
                                    <FaEdit className="inline-block w-4 h-4" />
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* --- Pagination --- */}
            {totalPages > 1 && (
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    {/* Các nút Prev/Next */}
                    <div className="flex-1 flex justify-between sm:justify-end">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 mr-3"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>

                    {/* Số trang */}
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            {getPageNumbers().map(page => (
                                <button
                                    key={page}
                                    onClick={() => onPageChange(page)}
                                    aria-current={page === currentPage ? 'page' : undefined}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage ? 'z-10 bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserTable;