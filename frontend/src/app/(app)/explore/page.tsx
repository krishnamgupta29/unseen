'use client';

import { Search, Flame, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { feed, users } from '@/lib/api';

export default function ExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [trendingTags, setTrendingTags] = useState<{tag: string, count: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feed.getTrendingTags()
      .then(tags => setTrendingTags(tags))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await users.search(searchQuery.trim());
        setSearchResults(results);
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  return (
    <div className="w-full min-h-screen">
      <Header title="Search" />
      
      <div className="p-4 border-b border-unseen-800/50 sticky top-[73px] z-30 bg-[#080016]/90 backdrop-blur-md">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-unseen-900 border border-unseen-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-unseen-400 focus:ring-1 focus:ring-unseen-400 transition-all shadow-[0_0_15px_rgba(36,0,70,0.5)]"
            placeholder="Search users..."
          />
        </div>
      </div>

      <div className="p-0">
        {searchQuery.trim() ? (
          <div>
            <div className="flex items-center space-x-2 px-6 py-6 border-b border-unseen-800/30">
              <Search className="w-5 h-5 text-unseen-400" />
              <h2 className="text-lg font-bold font-poppins text-white">Search Results</h2>
            </div>
            
            <div className="p-6">
              {searching ? (
                <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-unseen-400" /></div>
              ) : searchResults.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <p className="text-sm font-semibold text-gray-200">No users found</p>
                  <p className="text-xs mt-1.5 text-gray-500">No matches for &quot;{searchQuery}&quot;.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map(u => (
                    <div 
                      key={u._id}
                      onClick={() => router.push(`/profile?id=${u._id}`)}
                      className="glass p-4 rounded-xl flex items-center space-x-4 cursor-pointer hover:bg-unseen-900/40 transition-colors border border-transparent hover:border-unseen-800/30"
                    >
                      <div className="relative w-12 h-12 rounded-full border-2 border-[#080016] shrink-0 overflow-hidden shadow-[0_0_10px_rgba(157,78,221,0.3)]">
                        <div className={`absolute inset-0 bg-gradient-to-br ${u.avatarColor || 'from-unseen-500 to-unseen-800'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold truncate text-sm">{u.displayName}</h4>
                        <p className="text-gray-400 text-xs font-mono truncate">@{u.username}</p>
                        {u.bio && <p className="text-gray-500 text-xs truncate mt-1">{u.bio}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center space-x-2 px-6 py-6 border-b border-unseen-800/30">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold font-poppins text-white">Trending</h2>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-unseen-400" /></div>
              ) : trendingTags.length === 0 ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center min-h-[220px]">
                  <div className="w-14 h-14 rounded-full bg-unseen-900/40 flex items-center justify-center mb-4 border border-unseen-800/30 shadow-[0_0_12px_rgba(249,115,22,0.1)]">
                    <Flame className="w-6 h-6 text-gray-600 opacity-60" />
                  </div>
                  <p className="text-sm font-semibold text-gray-200">No trending posts yet — explore the feed and start the conversation.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trendingTags.map((t, i) => (
                    <div key={i} className="glass p-4 rounded-xl flex justify-between items-center group cursor-pointer" onClick={() => router.push(`/feed`)}>
                      <div>
                        <p className="text-lg font-semibold text-gray-200 group-hover:text-unseen-400 transition-colors">#{t.tag}</p>
                        <p className="text-sm text-gray-500">{t.count} posts</p>
                      </div>
                      <Flame className="w-5 h-5 text-unseen-800 group-hover:text-orange-500 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
