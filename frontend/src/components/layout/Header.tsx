'use client';
import { Bell, Heart, MessageCircle, User as UserIcon, ArrowLeft } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';

export default function Header({ title, showBack }: { title: string; showBack?: boolean }) {
  const { notifications = [], markNotificationsRead = () => {}, users = [] } = useAppContext() as any;
  const [showDropdown, setShowDropdown] = useState(false);
  
  const unreadCount = notifications.filter((n: any) => !n.read).length;
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const toggleDropdown = () => {
    if (!showDropdown && unreadCount > 0) {
      markNotificationsRead();
    }
    setShowDropdown(!showDropdown);
  };

  const getIcon = (type: string) => {
    if (type === 'LIKE') return <Heart className="w-4 h-4 text-pink-500 fill-current" />;
    if (type === 'COMMENT') return <MessageCircle className="w-4 h-4 text-blue-400" />;
    if (type === 'REPORT') return <span className="text-red-500">⚠️</span>;
    return <UserIcon className="w-4 h-4 text-unseen-400" />;
  };

  const getText = (type: string, username: string, n?: any) => {
    if (type === 'LIKE') return <><span className="font-bold text-gray-200">{username}</span> liked your post.</>;
    if (type === 'COMMENT') return <><span className="font-bold text-gray-200">{username}</span> commented on your post.</>;
    if (type === 'REPORT') return <><span className="font-bold text-red-400">Alert:</span> Your post was reported for: {n?.reason || 'Inappropriate behavior'}</>;
    return <><span className="font-bold text-gray-200">{username}</span> followed you.</>;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#080016]/80 backdrop-blur-md border-b border-unseen-800/50 p-4 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        {showBack && (
          <button 
            onClick={() => window.history.back()}
            className="p-1.5 rounded-full hover:bg-unseen-900/50 transition-colors text-gray-400 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xl font-poppins font-bold text-white">{title}</h1>
      </div>
      
      <div className="relative" ref={dropdownRef}>
        <button 
          className="relative p-2 rounded-full hover:bg-unseen-900/50 transition-colors text-gray-400 hover:text-white"
          onClick={toggleDropdown}
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-unseen-400 rounded-full border-2 border-[#080016]" />
          )}
        </button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-12 w-80 max-h-[400px] overflow-y-auto bg-[#10081d] border border-unseen-700/50 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.9)] z-50 p-2"
            >
              <h3 className="text-white font-bold px-4 py-2 border-b border-unseen-800/50 mb-2">Notifications</h3>
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-500 text-sm">All caught up!</div>
              ) : (
                notifications.map((n: any) => {
                  const fromUser = users.find((u: any) => u.id === n.fromUserId);
                  if (!fromUser) return null;
                  return (
                    <div key={n.id} className="flex items-start space-x-3 p-3 hover:bg-unseen-800/30 rounded-xl transition-colors cursor-pointer">
                      <div className="mt-1">{getIcon(n.type)}</div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 font-inter leading-tight">
                          {getText(n.type, fromUser.displayName, n)}
                        </p>
                        <span className="text-xs text-gray-500 mt-1 block">{n.timeAgo}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
