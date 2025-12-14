import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';

const COLORS = ['#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a']; // Shades of Blue

const PriceDistributionChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="w-full h-full flex items-center justify-center text-gray-500">No price distribution data available.</div>;
    }

    const chartData = data.map((item, index) => ({
        id: index,
        value: item.count,
        label: `$${item._id}`, 
        color: COLORS[index % COLORS.length]
    }));

    return (
        <div className="w-full h-full">
            <PieChart
                series={[
                    {
                        data: chartData,
                        innerRadius: 30,
                        outerRadius: 90,
                        paddingAngle: 2,
                        cornerRadius: 5,
                        cx: 125,
                        cy: 120,
                    },
                ]}
                width={280}
                height={280}
                slotProps={{
                    legend: {
                        direction: 'column',
                        position: { vertical: 'middle', horizontal: 'right' },
                        padding: { top: 10 },
                        labelStyle: { fontSize: 12 }
                    },
                }}
            />
        </div>
    );
};

export default PriceDistributionChart;