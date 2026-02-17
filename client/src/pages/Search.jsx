import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../services/api";
import PostCard from "../components/PostCard";

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [results, setResults] = useState({ users: [], posts: [], scripts: [] });
  const [loading, setLoading] = useState(false);

  const handleSearch = async (term = searchTerm) => {
    if (!term.trim()) { setResults({ users: [], posts: [], scripts: [] }); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/search?q=${term}&type=${activeTab}`);
      setResults(data);
    } catch (error) {
      if (activeTab === "users") {
        setResults({
          users: [
            { _id: "1", name: "John Doe", role: "creator", bio: "Passionate screenwriter with 10+ years experience", profileImage: "https://via.placeholder.com/100", followers: [1, 2, 3] },
            { _id: "2", name: "Jane Smith", role: "investor", bio: "Looking for promising scripts to fund", profileImage: "https://via.placeholder.com/100", followers: [1, 2] },
          ], posts: [], scripts: [],
        });
      } else if (activeTab === "scripts") {
        setResults({
          users: [], posts: [],
          scripts: [{ _id: "1", title: "The Last Dawn", description: "A post-apocalyptic thriller about survival", genre: "Thriller", price: 99.99, isPremium: true, coverImage: "https://via.placeholder.com/300x400", creator: { name: "John Doe" } }],
        });
      }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const debounce = setTimeout(() => { if (searchTerm) handleSearch(); }, 500);
    return () => clearTimeout(debounce);
  }, [searchTerm, activeTab]);

  const tabs = [
    { id: "users", label: "People" },
    { id: "posts", label: "Posts" },
    { id: "scripts", label: "Scripts" },
  ];

  return (
    <div className="max-w-3xl lg:max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Explore</h1>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search people, posts, or scripts..."
              className="w-full py-3 sm:py-3.5 pl-12 pr-4 bg-white border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                "flex-1 py-2.5 sm:py-3 text-sm sm:text-base font-bold rounded-lg transition-all",
                activeTab === tab.id ? "bg-white text-[#1e3a5f] shadow-sm" : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-3 border-gray-200 border-t-[#1e3a5f] rounded-full animate-spin"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !searchTerm && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-700 mb-1">Start your search</p>
            <p className="text-base text-gray-500">Find people, posts, and scripts</p>
          </div>
        )}

        {/* Results */}
        {!loading && searchTerm && (
          <div className="space-y-3 sm:space-y-4">
            {activeTab === "users" && results.users.map((u) => (
              <motion.div key={u._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition"
              >
                <Link to={`/profile/${u._id}`} className="flex items-center gap-3 sm:gap-4">
                  <img src={u.profileImage} alt={u.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">{u.name}</h3>
                    <p className="text-sm text-[#1e3a5f] capitalize font-semibold mb-0.5">{u.role}</p>
                    <p className="text-sm sm:text-base text-gray-500 line-clamp-1">{u.bio}</p>
                  </div>
                  <span className="text-sm text-gray-400 font-medium flex-shrink-0">{u.followers?.length || 0} followers</span>
                </Link>
              </motion.div>
            ))}

            {activeTab === "posts" && results.posts.map((post) => <PostCard key={post._id} post={post} />)}

            {activeTab === "scripts" && results.scripts.map((script) => (
              <motion.div key={script._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
                  <img src={script.coverImage} alt={script.title} className="w-full sm:w-28 h-40 sm:h-40 object-cover rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">{script.title}</h3>
                        <p className="text-sm text-gray-500 font-medium">by {script.creator?.name}</p>
                      </div>
                      {script.isPremium && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-lg text-xs font-semibold flex-shrink-0">⭐ Premium</span>
                      )}
                    </div>
                    <p className="text-base text-gray-600 line-clamp-2 mb-3">{script.description}</p>
                    <div className="flex items-center gap-3">
                      <span className="bg-[#1e3a5f]/10 text-[#1e3a5f] px-3 py-1 rounded-lg text-sm font-semibold">{script.genre}</span>
                      <span className="text-base font-bold text-[#1e3a5f]">${script.price}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* No Results */}
            {((activeTab === "users" && results.users.length === 0) ||
              (activeTab === "posts" && results.posts.length === 0) ||
              (activeTab === "scripts" && results.scripts.length === 0)) && (
              <div className="text-center py-12">
                <p className="text-base text-gray-500">No {activeTab} found for &ldquo;{searchTerm}&rdquo;</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Search;
