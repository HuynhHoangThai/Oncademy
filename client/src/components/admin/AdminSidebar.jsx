import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { FaChevronDown, FaChevronUp, FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa';
import { BarChart3, FileText, BookOpen, Users } from 'lucide-react';
import { useState } from 'react';

const AdminSidebar = () => {
    const location = useLocation();

    const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState(
        location.pathname.startsWith('/admin/users')
    );

    const toggleUsersDropdown = () => {
        setIsUsersDropdownOpen(!isUsersDropdownOpen);
    };

    const navItems = [
        { name: 'Dashboard', path: '/admin', icon: BarChart3 },
        { name: 'Pending Applications', path: '/admin/applications', icon: FileText },
        { name: 'Pending Courses', path: '/admin/courses/pending', icon: BookOpen },
    ];

    const isActive = (path) => {
        if (path === '/admin') {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="w-64 bg-gray-800 text-white flex flex-col h-full">
            <div className="p-4 text-2xl font-bold border-b border-gray-700">Admin Panel</div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        to={item.path}
                        className={`flex items-center p-2 rounded-lg transition duration-200 ${isActive(item.path) && item.path !== '/admin/users' ? 'bg-blue-600' : 'hover:bg-gray-700'
                            }`}
                    >
                        <item.icon className="mr-3" size={20} />
                        {item.name}
                    </Link>
                ))}

                <div className="pt-2">
                    <button
                        onClick={toggleUsersDropdown}
                        // Active state cho nút dropdown cha nếu đang ở bất kỳ trang con nào của Users
                        className={`w-full flex justify-between items-center p-2 rounded-lg transition duration-200 ${location.pathname.startsWith('/admin/users') ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'
                            }`}
                    >
                        <span className="flex items-center">
                            <Users className="mr-3" size={20} />
                            Manage Users
                        </span>
                        {isUsersDropdownOpen ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                    </button>

                    {isUsersDropdownOpen && (
                        <div className="ml-4 mt-1 space-y-1 border-l border-gray-600 pl-3">

                            {/* Educator List */}
                            <Link
                                to="/admin/users/educators"
                                className={`flex items-center p-2 rounded-lg transition duration-200 text-sm ${location.pathname.startsWith('/admin/users/educators') ? 'bg-blue-600' : 'hover:bg-gray-700'
                                    }`}
                            >
                                <FaChalkboardTeacher className="w-4 h-4 mr-3" />
                                Educators
                            </Link>

                            {/* Student List */}
                            <Link
                                to="/admin/users/students"
                                className={`flex items-center p-2 rounded-lg transition duration-200 text-sm ${location.pathname.startsWith('/admin/users/students') ? 'bg-blue-600' : 'hover:bg-gray-700'
                                    }`}
                            >
                                <FaUserGraduate className="w-4 h-4 mr-3" />
                                Students
                            </Link>
                        </div>
                    )}
                </div>
            </nav>
            <div className="p-4 border-t border-gray-700 flex-shrink-0 mt-auto">
                <div className="flex items-center justify-between">
                    <span>Admin User</span>
                    <UserButton afterSignOutUrl="/" />
                </div>
            </div>
        </div>
    );
};

export default AdminSidebar;