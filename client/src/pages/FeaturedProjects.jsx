import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const FeaturedProjects = () => {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatured();
  }, []);

  const fetchFeatured = async () => {
    try {
      const { data } = await api.get("/scripts?sort=score");
      // Featured = scored scripts or premium, sorted by score
      const featured = data.filter(
        (s) => s.scriptScore?.overall || s.premium
      );
      setScripts(featured.length > 0 ? featured : data.slice(0, 12));
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
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Featured Projects</h1>
        <p className="text-base text-gray-500 mt-1">Highlighted and top-scored scripts</p>
      </div>

      {scripts.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-lg">
          <p className="text-base text-gray-500">No featured projects yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scripts.map((script) => (
            <Link
              key={script._id}
              to={`/script/${script._id}`}
              className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
            >
              {/* Cover */}
              <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
                {script.coverImage ? (
                  <img
                    src={script.coverImage}
                    alt={script.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                )}
                {script.scriptScore?.overall && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full">
                    Score {script.scriptScore.overall}
                  </div>
                )}
                {script.premium && (
                  <div className="absolute top-2 left-2 bg-[#1e3a5f]/80 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    ${script.price}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-base font-bold text-gray-900 truncate">{script.title}</h3>
                <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{script.description || script.synopsis}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5">
                    {script.creator?.profileImage ? (
                      <img src={script.creator.profileImage} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                        {script.creator?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                    <span className="text-sm text-gray-500 font-medium">{script.creator?.name || "Unknown"}</span>
                  </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {script.views || 0}
                    </span>
                    {script.genre && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-semibold text-gray-500">
                        {script.genre}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedProjects;
