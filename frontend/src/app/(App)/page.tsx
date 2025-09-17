
'use client';

import { useState } from 'react';

export default function TextProcessor() {
  const [text, setText] = useState('');
  const [operation, setOperation] = useState('both');
  const [results, setResults] = useState<{
    summaries?: Record<string, string>;
    tones?: Record<string, string>;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/process-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, operation }),
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.results);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error processing text:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Text Processor</h1>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your text:
              </label>
              <textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to process..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-32 resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select processing type:
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="summary"
                    checked={operation === 'summary'}
                    onChange={(e) => setOperation(e.target.value)}
                    className="mr-2"
                  />
                  Summary only
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="tone"
                    checked={operation === 'tone'}
                    onChange={(e) => setOperation(e.target.value)}
                    className="mr-2"
                  />
                  Tone transformation only
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="both"
                    checked={operation === 'both'}
                    onChange={(e) => setOperation(e.target.value)}
                    className="mr-2"
                  />
                  Both
                </label>
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={!text.trim() || loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Process Text'}
            </button>
          </div>

          {results && (
            <div className="mt-8 space-y-6">
              {results.summaries && (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Summaries</h2>
                  <div className="space-y-4">
                    {Object.entries(results.summaries).map(([length, summary]) => (
                      <div key={length}>
                        <h3 className="font-medium text-gray-700 capitalize mb-2">{length} summary:</h3>
                        <p className="text-gray-600 bg-white p-3 rounded border">{summary as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.tones && (
                <div className="bg-green-50 p-6 rounded-lg">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Tone Transformations</h2>
                  <div className="space-y-4">
                    {Object.entries(results.tones).map(([tone, text]) => (
                      <div key={tone}>
                        <h3 className="font-medium text-gray-700 capitalize mb-2">{tone}:</h3>
                        <p className="text-gray-600 bg-white p-3 rounded border">{text as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}