import React from 'react';

const KpiCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 transition hover:shadow-xl">
        <div className={`p-3 rounded-full ${color}`}>
            <span className="text-xl">{icon}</span>
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

export default KpiCard;