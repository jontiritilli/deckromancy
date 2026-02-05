export default function SynergyTags({ synergies }) {
  const { keywords, themes } = synergies;

  // Sort keywords by count (descending)
  const sortedKeywords = Object.entries(keywords)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  if (sortedKeywords.length === 0 && themes.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      {/* Keywords */}
      {sortedKeywords.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Synergies</h3>
          <div className="flex flex-wrap gap-2">
            {sortedKeywords.map(([keyword, count]) => (
              <span
                key={keyword}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-200"
              >
                <span>{keyword}</span>
                <span className="text-purple-400 font-semibold">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Themes */}
      {themes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Themes</h3>
          <div className="flex flex-wrap gap-2">
            {themes.map((theme) => (
              <span
                key={theme}
                className="px-3 py-1 bg-purple-900/50 border border-purple-600 rounded-full text-sm text-purple-300"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
