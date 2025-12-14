import React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';

const CHART_HEIGHT = 350;

const MonthlyRevenueChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="w-full h-full flex items-center justify-center text-gray-500">No revenue data available for this period.</div>;
    }

    const months = data.map(item => item.month); 
    const earnings = data.map(item => item.earnings); 

    const seriesData = [
        {
            type: 'bar', 
            data: earnings,
            label: 'Revenue',
            color: '#4c51bf',
        }
    ];

    return (
        <div className="w-full h-full">
            <BarChart
                xAxis={[{
                    scaleType: 'band', 
                    data: months,
                    tickLabelStyle: {
                        angle: -30,
                        textAnchor: 'end',
                        fontSize: 12
                    }
                }]}
                yAxis={[{
                    tickFormatter: (value) => `$${value.toLocaleString()}`,
                    label: 'Earnings ($)',
                    fontSize: 12
                }]}
                series={seriesData}
                height={CHART_HEIGHT}
                margin={{ bottom: 70, right: 20, left: 60 }}
            />
        </div>
    );
};

export default MonthlyRevenueChart;