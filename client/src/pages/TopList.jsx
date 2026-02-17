import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const TopList = () => {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("views");

  useEffect(() => {
    fetchScripts();
  }, [sortBy]);

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/scripts?sort=${sortBy}`);
      setScripts(data);
    } catch {
      setScripts([]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-[#1e3a5f] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Top List</h1>
          <p className="text-base text-gray-500 mt-1">Most viewed and highest scored projects</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {[
            { key: "views", label: "Views" },
            { key: "score", label: "Score" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSortBy(tab.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                sortBy === tab.key
                  ? "bg-white text-[#1e3a5f] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {scripts.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-lg">
          <p className="text-base text-gray-500">No projects found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {scripts.map((script, index) => (
            <Link
              key={script._id}
              to={`/script/${script._id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              {/* Rank */}
              <span className={`w-7 text-center text-base font-bold shrink-0 ${
                index < 3 ? "text-[#1e3a5f]" : "text-gray-400"
              }`}>
                {index + 1}
              </span>

              {/* Cover */}
              {script.coverImage ? (
                <img src={script.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate">{script.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {script.creator?.name || "Unknown"} · {script.genre || script.contentType}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-base font-bold text-gray-900">{script.views || 0}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Views</p>
                </div>
                {script.scriptScore?.overall && (
                  <div className="text-right">
                    <p className="text-base font-bold text-gray-900">{script.scriptScore.overall}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Score</p>
                  </div>
                )}
                {script.premium && (
                  <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    ${script.price}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopList;
