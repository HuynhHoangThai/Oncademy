import React from 'react';

const RecentEnrollmentsTable = ({ enrollments }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {enrollments && enrollments.length > 0 ? (
                        enrollments.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.studentName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600">{item.courseTitle}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">${item.amount ? item.amount.toFixed(2) : '0.00'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No recent enrollments found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default RecentEnrollmentsTable;