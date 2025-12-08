import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../../utils/api';
import MonthlyRevenueChart from './MonthlyRevenueChart';
import LoadingSpinner from '../../common/LoadingSpinner';

const INTERVAL_OPTIONS = [
    { label: 'Weekly', value: 'weekly', limit: 8 },
    { label: 'Monthly', value: 'monthly', limit: 6 },
    { label: 'Yearly', value: 'yearly', limit: 5 },
];

const RevenueTrendContainer = () => {
    const [monthlyEarnings, setMonthlyEarnings] = useState([]);
    const [loadingChart, setLoadingChart] = useState(false);
    const [interval, setInterval] = useState(INTERVAL_OPTIONS[1]);

    const fetchRevenueData = async () => {
        setLoadingChart(true);
        try {
            const params = `interval=${interval.value}&limit=${interval.limit}`;
            const response = await api.get(`/api/admin/revenue-trend?${params}`);
            
            setMonthlyEarnings(response.monthlyEarnings || []);

        } catch (error) {
            console.error("Fetch Revenue Trend Error:", error);
            toast.error(`Failed to load ${interval.label.toLowerCase()} revenue data.`);
        } finally {
            setLoadingChart(false);
        }
    };

    useEffect(() => {
        fetchRevenueData();
    }, [interval]);

    const handleIntervalChange = (e) => {
        const selectedValue = e.target.value;
        const selectedInterval = INTERVAL_OPTIONS.find(opt => opt.value === selectedValue);

        if (selectedInterval) {
            setInterval(selectedInterval);
        }
    };

    return (
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg h-96 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">{interval.label} Revenue Trend</h2>

                <select
                    value={interval.value}
                    onChange={handleIntervalChange}
                    className="p-1 border border-gray-300 rounded-lg text-sm"
                    disabled={loadingChart}
                >
                    {INTERVAL_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex-grow relative" style={{ minHeight: '200px' }}>
                {loadingChart ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                        <LoadingSpinner size="h-8 w-8" />
                    </div>
                ) : (
                    <MonthlyRevenueChart data={monthlyEarnings} />
                )}
            </div>
        </div>
    );
};

export default RevenueTrendContainer;