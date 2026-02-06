import { useState, useEffect } from 'react';

export default function DeckInput({ onImport, onClear, loading, hasDeck, initialUrl }) {
  const [url, setUrl] = useState('');

  // Pre-fill input if deck was auto-loaded from URL
  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onImport(url.trim());
    }
  };

  const handleClear = () => {
    setUrl('');
    onClear();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter curiosa.io deck URL..."
        className="flex-1 px-4 py-2 bg-shadow-grey-900 border border-shadow-grey-600 rounded-lg text-shadow-grey-100 placeholder-shadow-grey-500 focus:outline-none focus:ring-2 focus:ring-sandy-brown-400 focus:border-transparent"
        disabled={loading}
      />
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="flex-1 sm:flex-none px-6 py-2.5 bg-pacific-cyan-500 hover:bg-pacific-cyan-600 disabled:bg-shadow-grey-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading...
            </span>
          ) : (
            'Import'
          )}
        </button>
        {hasDeck && (
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-shadow-grey-800 hover:bg-shadow-grey-700 text-shadow-grey-300 font-medium rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
