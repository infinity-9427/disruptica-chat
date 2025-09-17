"use client";

import { useCompletion } from "@ai-sdk/react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function CompletionStreamPage() {
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    setInput,
  } = useCompletion({
    api: "/api/stream",
  });

  // Handle errors with toast notifications
  useEffect(() => {
    if (error) {
      if (error.message.includes('quota')) {
        toast.error("Rate limit exceeded", {
          description: "Please wait before trying again",
          duration: 4000,
        });
      } else if (error.message.includes('authentication')) {
        toast.error("Authentication failed", {
          description: "Please check your API configuration",
          duration: 4000,
        });
      } else {
        toast.error("Stream error", {
          description: error.message || "Something went wrong. Please try again.",
          duration: 3000,
        });
      }
    }
  }, [error]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    
    setInput("");
    handleSubmit(e);
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {isLoading && !completion && <div>Loading...</div>}

      {completion && <div className="whitespace-pre-wrap">{completion}</div>}
      <form
        onSubmit={handleFormSubmit}
        className="fixed bottom-0 w-full max-w-md mx-auto left-0 right-0 p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 shadow-lg"
      >
        <div className="flex gap-2">
          <input
            className="flex-1 dark:bg-zinc-800 p-2 border border-zinc-300 dark:border-zinc-700 rounded shadow-xl"
            value={input}
            onChange={handleInputChange}
            placeholder="How can I help you?"
          />
          {isLoading ? (
            <button
              onClick={stop}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
}