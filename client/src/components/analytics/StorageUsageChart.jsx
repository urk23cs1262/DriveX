import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const formatted = value > 1024 * 1024
      ? `${(value / (1024 * 1024)).toFixed(2)} MB`
      : `${(value / 1024).toFixed(2)} KB`;

    return (
      <div className="bg-white p-3 border border-gray-100 rounded-lg shadow-xl text-xs">
        <p className="font-bold text-gray-700 mb-1 uppercase tracking-wider">{payload[0].payload.name}</p>
        <p className="text-gray-500 font-medium">Storage: <span className="text-gray-900">{formatted}</span></p>
      </div>
    );
  }
  return null;
};

const StorageUsageChart = ({ data }) => {
  // Memoize chart data to avoid re-renders unless data changes
  const chartData = useMemo(() => {
    return data.map(node => ({
      name: node.id,
      value: node.storageUsed || 0
    }));
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 h-[350px] flex flex-col">
      <h3 className="text-sm font-semibold text-gray-800 mb-6">Storage Used per Node</h3>
      <div className="flex-1 w-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%" minHeight={100}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickFormatter={(value) => value > 0 ? `${(value / (1024 * 1024)).toFixed(1)}M` : '0'}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(StorageUsageChart);
