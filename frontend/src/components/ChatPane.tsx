export default function ChatPane() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 select-none">
      <div className="mb-6 h-20 w-20 rounded-full bg-orange-500/10 flex items-center justify-center">
        <svg className="h-10 w-10 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      <h2 className="text-[22px] font-black text-white tracking-tight mb-2">Whispr</h2>
      <p className="text-sm text-gray-400 max-w-[240px] text-center leading-relaxed">
        Select a conversation from the left to start messaging
      </p>

      <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-xs">
        {['End-to-end encrypted', 'Fast & reliable', 'Cross-device'].map((tag) => (
          <span key={tag} className="px-3 py-1 rounded-full bg-gray-800 text-[11px] font-medium text-gray-400">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
