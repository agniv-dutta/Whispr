'use client';

export function NoConversations() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <svg width="200" height="160" viewBox="0 0 200 160" fill="none" className="mb-6">
        <circle cx="60" cy="80" r="40" fill="#00a884" opacity="0.15" />
        <circle cx="140" cy="80" r="40" fill="#00a884" opacity="0.15" />
        <rect x="30" y="60" width="48" height="32" rx="8" fill="#2c3e50" />
        <rect x="38" y="68" width="16" height="6" rx="3" fill="#00a884" />
        <rect x="58" y="68" width="12" height="6" rx="3" fill="#4a5568" />
        <rect x="38" y="78" width="24" height="4" rx="2" fill="#4a5568" />
        <rect x="122" y="60" width="48" height="32" rx="8" fill="#2c3e50" />
        <rect x="130" y="68" width="16" height="6" rx="3" fill="#00a884" />
        <rect x="150" y="68" width="12" height="6" rx="3" fill="#4a5568" />
        <rect x="130" y="78" width="24" height="4" rx="2" fill="#4a5568" />
        <path d="M90 130l-8-16h16l-8 16z" fill="#00a884" opacity="0.3" />
        <path d="M100 100q20-10 40-5" stroke="#2c3e50" strokeWidth="2" strokeDasharray="4 3" fill="none" />
        <path d="M100 100q-20-10-40-5" stroke="#2c3e50" strokeWidth="2" strokeDasharray="4 3" fill="none" />
      </svg>
      <h3 className="text-lg font-medium text-gray-300">No conversations yet</h3>
      <p className="mt-1 text-sm text-gray-500">Start a new chat to begin messaging</p>
    </div>
  );
}

export function NoMessages() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <svg width="120" height="100" viewBox="0 0 120 100" fill="none" className="mb-4">
        <rect x="10" y="20" width="80" height="50" rx="8" fill="#2c3e50" />
        <rect x="18" y="30" width="16" height="6" rx="3" fill="#4a5568" />
        <rect x="38" y="30" width="24" height="6" rx="3" fill="#4a5568" />
        <rect x="18" y="42" width="40" height="4" rx="2" fill="#4a5568" />
        <rect x="18" y="52" width="20" height="4" rx="2" fill="#4a5568" />
        <path d="M95 60l-6-12h12l-6 12z" fill="#00a884" opacity="0.4" />
      </svg>
      <p className="text-sm text-gray-500">No messages yet</p>
    </div>
  );
}
