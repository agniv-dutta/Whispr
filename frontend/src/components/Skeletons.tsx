'use client';

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export function ConversationSkeleton() {
  return (
    <div className="p-3 border-b border-[#2c3e50]">
      <div className="flex items-center gap-3">
        <Skeleton circle width={48} height={48} baseColor="#2c3e50" highlightColor="#3a5068" />
        <div className="flex-1">
          <Skeleton width="60%" height={14} baseColor="#2c3e50" highlightColor="#3a5068" />
          <Skeleton width="80%" height={12} baseColor="#2c3e50" highlightColor="#3a5068" style={{ marginTop: 6 }} />
        </div>
      </div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-4 py-2">
      <div className={`flex max-w-[70%] ${Math.random() > 0.5 ? 'ml-auto' : ''}`}>
        <Skeleton
          width={180 + Math.random() * 120}
          height={48}
          borderRadius={12}
          baseColor="#2c3e50"
          highlightColor="#3a5068"
        />
      </div>
      <div className={`flex max-w-[70%] ${Math.random() > 0.5 ? 'ml-auto' : ''}`}>
        <Skeleton
          width={120 + Math.random() * 100}
          height={36}
          borderRadius={12}
          baseColor="#2c3e50"
          highlightColor="#3a5068"
        />
      </div>
      <div className={`flex max-w-[70%] ${Math.random() > 0.5 ? 'ml-auto' : ''}`}>
        <Skeleton
          width={200 + Math.random() * 80}
          height={52}
          borderRadius={12}
          baseColor="#2c3e50"
          highlightColor="#3a5068"
        />
      </div>
    </div>
  );
}
