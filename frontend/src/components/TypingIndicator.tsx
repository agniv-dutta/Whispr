"use client";

interface Props {
  names: string[];
}

export default function TypingIndicator({ names }: Props) {
  if (names.length === 0) return null;

  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 mt-2">
      {/* Assuming we just use an empty space for avatar alignment if avatar isn't passed, but let's add a placeholder avatar circle for the typing user if needed. For now, matching the padding. */}
      <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700 shrink-0 overflow-hidden ml-1">
        {/* We would put the user's avatar here if passed in props */}
      </div>
      <div className="flex items-center gap-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
        </span>
        <span className="text-[13px] italic font-medium text-text-secondary">{label}...</span>
      </div>
    </div>
  );
}
