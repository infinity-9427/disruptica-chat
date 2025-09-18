export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-300">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse [animation-delay:200ms]" />
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse [animation-delay:400ms]" />
    </div>
  );
}