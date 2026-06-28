'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useWeeklyCount, useActivityByHour } from '@/lib/analytics';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

export function WeeklyChart() {
  const counts = useWeeklyCount();

  const data = DAYS.map((name, i) => ({ name, messages: counts[i] }));

  return (
    <div className="rounded-xl bg-[#1a1a2e] p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Messages This Week</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#e5e7eb' }}
          />
          <Bar dataKey="messages" fill="#00a884" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ActivityHeatmap() {
  const hours = useActivityByHour();

  const data = hours.map((count, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    count,
    fill: count > 0 ? `rgba(0, 168, 132, ${Math.min(0.8, count / 10)})` : '#1f2937',
  }));

  return (
    <div className="rounded-xl bg-[#1a1a2e] p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Activity by Hour</h3>
      <div className="grid grid-cols-12 gap-1">
        {data.map((d) => (
          <div
            key={d.hour}
            className="h-6 rounded text-[9px] flex items-center justify-center"
            style={{ backgroundColor: d.fill, color: d.count > 5 ? '#fff' : '#6b7280' }}
            title={`${d.hour} - ${d.count} messages`}
          >
            {d.count || ''}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
        <span>Less</span>
        <div className="h-3 w-3 rounded bg-[#1f2937]" />
        <div className="h-3 w-3 rounded" style={{ backgroundColor: 'rgba(0,168,132,0.2)' }} />
        <div className="h-3 w-3 rounded" style={{ backgroundColor: 'rgba(0,168,132,0.5)' }} />
        <div className="h-3 w-3 rounded" style={{ backgroundColor: 'rgba(0,168,132,0.8)' }} />
        <span>More</span>
      </div>
    </div>
  );
}
