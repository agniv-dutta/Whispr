import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AnalyticsState {
  messagesSent: number;
  conversationsCreated: number;
  loginCount: number;
  messageTimestamps: string[];
  searchQueries: { query: string; count: number }[];
  deliveryTimes: number[];
  activityByHour: number[];

  trackMessageSent: () => void;
  trackConversationCreated: () => void;
  trackLogin: () => void;
  trackSearch: (query: string) => void;
  trackDeliveryTime: (ms: number) => void;
  clearCache: () => void;
}

export const useAnalytics = create<AnalyticsState>()(
  persist(
    (set) => ({
      messagesSent: 0,
      conversationsCreated: 0,
      loginCount: 0,
      messageTimestamps: [],
      searchQueries: [],
      deliveryTimes: [],
      activityByHour: Array(24).fill(0),

      trackMessageSent: () =>
        set((s) => ({
          messagesSent: s.messagesSent + 1,
          messageTimestamps: [...s.messageTimestamps.slice(-500), new Date().toISOString()],
          activityByHour: s.activityByHour.map((v, i) =>
            i === new Date().getHours() ? v + 1 : v
          ),
        })),

      trackConversationCreated: () =>
        set((s) => ({ conversationsCreated: s.conversationsCreated + 1 })),

      trackLogin: () =>
        set((s) => ({ loginCount: s.loginCount + 1 })),

      trackSearch: (query: string) =>
        set((s) => {
          const existing = s.searchQueries.find((q) => q.query === query);
          if (existing) {
            return {
              searchQueries: s.searchQueries.map((q) =>
                q.query === query ? { ...q, count: q.count + 1 } : q
              ),
            };
          }
          return { searchQueries: [...s.searchQueries.slice(-50), { query, count: 1 }] };
        }),

      trackDeliveryTime: (ms: number) =>
        set((s) => ({ deliveryTimes: [...s.deliveryTimes.slice(-100), ms] })),

      clearCache: () =>
        set({
          messagesSent: 0,
          conversationsCreated: 0,
          messageTimestamps: [],
          searchQueries: [],
          deliveryTimes: [],
          activityByHour: Array(24).fill(0),
        }),
    }),
    {
      name: 'whispr-analytics',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useWeeklyCount(): number[] {
  const timestamps = useAnalytics((s) => s.messageTimestamps);
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const days = [0, 0, 0, 0, 0, 0, 0];
  for (const ts of timestamps) {
      const t = new Date(ts).getTime();
      if (now - t < week) {
        const day = new Date(ts).getDay();
        days[day]++;
    }
  }
  return days;
}

export function useActiveDays(): number {
  const timestamps = useAnalytics((s) => s.messageTimestamps);
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
    const days = new Set<string>();
  for (const ts of timestamps) {
      const t = new Date(ts).getTime();
      if (now - t < week) {
        days.add(new Date(ts).toDateString());
    }
  }
  return days.size;
}

export function useAvgDeliveryTime(): number {
  const times = useAnalytics((s) => s.deliveryTimes);
  if (times.length === 0) return 0;
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
}

export function useEstimatedStorage(): number {
  const total = useAnalytics((s) => s.messagesSent);
  return total * 1024; // ~1KB per message
}

export function useTopSearches(): { query: string; count: number }[] {
  return useAnalytics((s) =>
    [...s.searchQueries].sort((a, b) => b.count - a.count).slice(0, 5)
  );
}

export function useActivityByHour(): number[] {
  return useAnalytics((s) => s.activityByHour);
}
