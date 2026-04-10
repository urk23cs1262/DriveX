import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value, percent } = payload[0];
    return (
      <div className="bg-white p-3 border border-gray-100 rounded-lg shadow-xl text-xs">
        <p className="font-bold text-gray-700 mb-1">{name}</p>
        <p className="text-gray-500 font-medium">Count: <span className="text-gray-900">{value}</span></p>
        <p className="text-gray-500 font-medium">Percentage: <span className="text-gray-900">{(percent * 100).toFixed(1)}%</span></p>
      </div>
    );
  }
  return null;
};

const FileTypeChart = ({ files }) => {
  const chartData = useMemo(() => {
    const counts = {};
    files.forEach(f => {
      const type = f.mimeType?.split('/')[0] || 'other';
      const category = type.charAt(0).toUpperCase() + type.slice(1);
      counts[category] = (counts[category] || 0) + 1;
    });

    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    })).sort((a, b) => b.value - a.value);
  }, [files]);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 h-[350px] flex flex-col">
      <h3 className="text-sm font-semibold text-gray-800 mb-6">File Type Distribution</h3>
      <div className="flex-1 w-full relative min-h-0">
        <ResponsiveContainer width="100%" height="85%" minHeight={100}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(FileTypeChart);
