import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useNodeStore } from '../../store/nodeStore';
import { usePolling } from '../../hooks/usePolling';

const NODE_COLORS = {
  node1: '#6366f1',
  node2: '#22c55e',
  node3: '#f59e0b',
};

// Custom tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="text-gray-500 mb-1.5 font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600 font-mono">{entry.dataKey}</span>
          <span className={`font-semibold ml-1 ${entry.value === 1 ? 'text-green-600' : 'text-red-500'}`}>
            {entry.value === 1 ? 'Online' : 'Offline'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function NodeHealthChart() {
  const { healthHistory, nodes, fetchHealth } = useNodeStore();

  // Poll health every 15 seconds for the graph
  usePolling(fetchHealth, 15000);

  // Fill with placeholder if not enough history yet
  const data = healthHistory.length < 2
    ? [{ time: '—' }, { time: '—' }]
    : healthHistory;

  const nodeIds = nodes.map((n) => n.id);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Node Health Timeline</h2>
          <p className="text-xs text-gray-400 mt-0.5">Last 60 seconds · 5s intervals</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
          Live
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-4">
        {nodeIds.map((id) => {
          const node = nodes.find((n) => n.id === id);
          const online = node?.status === 'online';
          return (
            <div key={id} className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: NODE_COLORS[id] || '#6366f1' }} />
              <span className="text-xs font-mono text-gray-500">{id}</span>
              <span className={`text-xs font-medium ${online ? 'text-green-600' : 'text-red-500'}`}>
                {online ? '●' : '○'}
              </span>
            </div>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 1]}
            tickFormatter={(v) => (v === 1 ? 'On' : 'Off')}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {nodeIds.map((id) => (
            <Line
              key={id}
              type="stepAfter"
              dataKey={id}
              stroke={NODE_COLORS[id] || '#6366f1'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={true}
              animationDuration={300}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}