'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Users, TrendingUp, Clock, HardDrive, Search, Zap, Trash2 } from 'lucide-react';
import { useAnalytics, useWeeklyCount, useActiveDays, useAvgDeliveryTime, useEstimatedStorage, useTopSearches } from '@/lib/analytics';
import { WeeklyChart, ActivityHeatmap } from '@/components/AnalyticsCharts';

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-[#1a1a2e] p-4 flex items-start gap-3">
      <div className="rounded-lg bg-[#00a884]/10 p-2 mt-0.5">
        <Icon className="w-5 h-5 text-[#00a884]" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { messagesSent, conversationsCreated, loginCount, clearCache } = useAnalytics();
  const weeklyCount = useWeeklyCount();
  const activeDays = useActiveDays();
  const avgDelivery = useAvgDeliveryTime();
  const estimatedStorage = useEstimatedStorage();
  const topSearches = useTopSearches();

  const totalThisWeek = weeklyCount.reduce((a, b) => a + b, 0);
  const storageMB = (estimatedStorage / (1024 * 1024)).toFixed(1);

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white pb-20">
      <header className="sticky top-0 z-10 bg-[#0d0d1a]/80 backdrop-blur-lg border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Analytics</h1>
            <p className="text-xs text-gray-500">Your messaging insights</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 pt-6 space-y-5">
        {/* Growth teaser */}
        <div className="rounded-xl bg-gradient-to-r from-[#00a884]/20 to-[#00a884]/5 border border-[#00a884]/20 p-4 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-[#00a884]" />
          <div>
            <p className="text-sm font-semibold">Join a growing community</p>
            <p className="text-xs text-gray-400">5M+ users · 2B+ messages sent daily</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={MessageSquare} label="Messages Sent" value={messagesSent.toLocaleString()} sub={`${totalThisWeek} this week`} />
          <StatCard icon={Users} label="Conversations" value={conversationsCreated.toString()} />
          <StatCard icon={Clock} label="Active Days" value={`${activeDays}/7`} sub="this week" />
          <StatCard icon={Zap} label="Avg Delivery" value={avgDelivery > 0 ? `${avgDelivery}ms` : '—'} sub="last 100 messages" />
          <StatCard icon={HardDrive} label="Storage Used" value={`${storageMB}MB`} sub="estimated" />
          <StatCard icon={TrendingUp} label="Logins" value={loginCount.toString()} />
        </div>

        {/* Top searches */}
        {topSearches.length > 0 && (
          <div className="rounded-xl bg-[#1a1a2e] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-[#00a884]" />
              <h3 className="text-sm font-semibold text-gray-300">Top Searches</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {topSearches.map((s) => (
                <span key={s.query} className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-300 border border-white/5">
                  {s.query} <span className="text-gray-500 ml-1">×{s.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        <WeeklyChart />
        <ActivityHeatmap />

        {/* Clear cache */}
        <button
          onClick={() => { clearCache(); }}
          className="w-full rounded-xl border border-red-500/20 p-3 flex items-center justify-center gap-2 text-sm text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear local analytics data
        </button>
      </div>
    </div>
  );
}
