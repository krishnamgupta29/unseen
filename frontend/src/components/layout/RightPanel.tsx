'use client';

import { useState, useEffect } from 'react';
import { Search, Flame, Users, Activity } from 'lucide-react';
import { feed, users } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socketClient';

export default function RightPanel() {
  const router = useRouter();
  const [trendingTags, setTrendingTags] = useState<{tag: string, count: number}[]>([]);
  const [liveShadows, setLiveShadows] = useState(0);
  const [encryptedNodes, setEncryptedNodes] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchStats = () => {
      feed.getNetworkStats()
        .then(stats => {
          setLiveShadows(stats.activeUsers || Math.floor((stats.totalUsers || 10) * 0.4) + Math.floor(Math.random() * 10));
          setEncryptedNodes(stats.totalPosts);
        })
        .catch(() => {});
    };

    const fetchTrending = () => {
      feed.getTrendingTags()
        .then(tags => setTrendingTags(tags))
        .catch(() => {});
    };

    fetchStats();
    fetchTrending();
    
    const socket = getSocket();
    
    const onNetworkStats = (data: any) => {
      if (data.stats) {
        setLiveShadows(data.stats.activeUsers);
        setEncryptedNodes(data.stats.totalPosts);
      }
      if (data.trending) {
        setTrendingTags(data.trending);
      }
    };
    
    socket.on('network:stats', onNetworkStats);
    
    return () => {
      socket.off('network:stats', onNetworkStats);
    };
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
    }, 500);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  return (
    <div className="hidden lg:block w-80 flex-shrink-0 p-6 h-screen sticky top-0 overflow-y-auto no-scrollbar border-l border-unseen-800/30 bg-[#0a0514]/50">
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-unseen-900/50 border border-unseen-800 rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-unseen-500 transition-colors"
          placeholder="Search tags or users..."
        />
        {searchQuery && (
          <div className="absolute top-full mt-2 w-full bg-[#0A0014] border border-unseen-800 rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
            {searching ? (
              <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map(user => (
                  <div 
                    key={user._id} 
                    onClick={() => {
                      router.push(`/profile?id=${user._id}`);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="flex items-center space-x-3 px-4 py-2 hover:bg-unseen-900/50 cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full border border-[#080016] shrink-0 overflow-hidden relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${user.avatarColor || 'from-gray-500 to-gray-700'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold truncate text-xs">{user.displayName}</h4>
                      <p className="text-gray-400 text-[10px] font-mono truncate">@{user.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">No users found</div>
            )}
          </div>
        )}
      </div>

      {/* Network Stats */}
      <div className="glass p-5 rounded-2xl mb-8 glass-glow">
        <div className="flex items-center space-x-2 mb-4 text-unseen-300">
          <Activity className="w-5 h-5" />
          <h2 className="font-bold font-poppins">Network Status</h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400 flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" /> Live Shadows</span>
            <span className="text-white font-mono font-bold">{liveShadows.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Total Encrypted Nodes</span>
            <span className="text-white font-mono font-bold">{encryptedNodes.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Trending */}
      <div className="glass p-5 rounded-2xl mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="font-bold font-poppins text-white">Trending Vibes</h2>
        </div>
        
        {trendingTags.length === 0 ? (
          <p className="text-gray-500 text-sm">No trending vibes yet.</p>
        ) : (
          <div className="space-y-4">
            {trendingTags.map((t, i) => (
              <div key={i} className="flex justify-between items-center group cursor-pointer">
                <span className="text-sm text-gray-400 flex items-center group-hover:text-unseen-400 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mr-2 opacity-80" /> #{t.tag}
                </span>
                <span className="text-white font-mono font-bold">{t.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-600 text-center mt-auto pt-8">
        <p>© {new Date().getFullYear()} Unseen Protocol</p>
        <p className="mt-1 flex justify-center space-x-2">
          <span className="hover:text-gray-400 cursor-pointer">Privacy</span>
          <span>·</span>
          <span className="hover:text-gray-400 cursor-pointer">Terms</span>
        </p>
      </div>
    </div>
  );
}
