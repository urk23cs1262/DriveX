import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const ActivityTimelineChart = () => {
  // Generate mock activity data for a 24-hour period (24 data points)
  const chartData = useMemo(() => {
    const data = [];
    const baseUploads = 15;
    const baseDownloads = 40;

    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0') + ':00';
      const randomnessU = Math.random() * 20 - 10;
      const randomnessD = Math.random() * 40 - 20;

      // Add peak traffic during "working hours"
      const peakFactor = (i > 8 && i < 18) ? 1.8 : 1.0;

      data.push({
        time: hour,
        uploads: Math.max(0, Math.floor((baseUploads + randomnessU) * peakFactor)),
        downloads: Math.max(0, Math.floor((baseDownloads + randomnessD) * peakFactor)),
      });
    }
    return data;
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 h-[350px] flex flex-col lg:col-span-2 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-gray-800">Cluster Activity (24h)</h3>
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-1.5 text-primary-500">
            <span className="w-2 h-2 rounded-full bg-primary-500" />
            Uploads
          </div>
          <div className="flex items-center gap-1.5 text-emerald-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Downloads
          </div>
        </div>
      </div>
      <div className="flex-1 w-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%" minHeight={100}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              interval={3}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: '600' }}
              itemStyle={{ padding: 0 }}
            />
            <Area
              type="monotone"
              dataKey="uploads"
              stroke="#6366f1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorUploads)"
            />
            <Area
              type="monotone"
              dataKey="downloads"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDownloads)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(ActivityTimelineChart);
