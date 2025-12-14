// src/pages/admin/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import KpiCard from '../../components/admin/KpiCard';
import RecentEnrollmentsTable from '../../components/admin/RecentEnrollmentsTable';
import { DollarSign, GraduationCap, BookOpen, ShoppingCart } from 'lucide-react';

import CourseStatusPieChart from '../../components/admin/charts/CourseStatusPieChart';
import RevenueTrendContainer from '../../components/admin/charts/RevenueTrendContainer';
import PriceDistributionChart from '../../components/admin/charts/PriceDistributionChart';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardStats = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/admin/dashboard-stats');
            setStats(response.data);
        } catch (error) {
            console.error("Fetch Dashboard Error:", error);
            toast.error("Failed to load dashboard data.");
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    if (loading) {
        return <div className="py-16 text-center"><LoadingSpinner size="h-12 w-12" /></div>;
    }

    if (!stats) {
        return <div className="text-center p-8 text-red-500">Could not load dashboard data. Please check the Backend API.</div>;
    }

    const kpiData = [
        { title: "Total Earnings", value: `$${stats.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })} `, icon: DollarSign, color: 'bg-green-100 text-green-700' },
        { title: "Total Enrollments", value: stats.totalEnrollments.toLocaleString(), icon: GraduationCap, color: 'bg-blue-100 text-blue-700' },
        { title: "Total Courses", value: stats.totalCourses.toLocaleString(), icon: BookOpen, color: 'bg-indigo-100 text-indigo-700' },
        { title: "Total Purchases", value: stats.totalPurchases.toLocaleString(), icon: ShoppingCart, color: 'bg-yellow-100 text-yellow-700' },
    ];

    return (
        <div className="space-y-8 p-4">
            <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiData.map((kpi, index) => (
                    <KpiCard key={index} {...kpi} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <RevenueTrendContainer />

                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-96 flex flex-col">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Purchase Price Distribution</h2>
                    <div className="flex-grow">
                        <PriceDistributionChart data={stats.priceDistribution} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Enrollments</h2>
                    <RecentEnrollmentsTable enrollments={stats.recentEnrollments} />
                </div>

                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-96 flex flex-col">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Course Status Distribution</h2>
                    <div className="flex-grow">
                        <CourseStatusPieChart data={stats.courseStatusDistribution} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;