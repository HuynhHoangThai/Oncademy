import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';

const COLORS = ['#4299e1', '#f6ad55']; 

const CourseStatusPieChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="w-full h-full flex items-center justify-center text-gray-500">No course status data available.</div>;
    }

    const chartData = data.map((item, index) => ({
        id: index,
        value: item.count,
        label: item.label, 
        color: COLORS[index % COLORS.length]
    }));

    return (
        <div className="w-full h-full pt-4">
            <PieChart
                series={[
                    {
                        data: chartData,
                        innerRadius: 40,
                        outerRadius: 80, 
                        paddingAngle: 2,
                        cornerRadius: 5,
                        cx: 125,
                        cy: 120,
                    },
                ]}
                width={260}
                height={220}

                slotProps={{
                    legend: {
                        direction: 'row',
                        position: { vertical: 'bottom', horizontal: 'middle' },
                        padding: { top: 10 },
                        labelStyle: { fontSize: 12 }
                    }
                }}
            />
        </div>
    );
};

export default CourseStatusPieChart;