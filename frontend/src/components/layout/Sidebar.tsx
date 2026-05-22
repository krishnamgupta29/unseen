'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Compass, MessageSquare, User, Bell, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { getSocket } from '@/lib/socketClient';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/feed', icon: <Home className="w-6 h-6" />, label: 'Echoes' },
  { href: '/explore', icon: <Compass className="w-6 h-6" />, label: 'Discover' },
  { href: '/messages', icon: <MessageSquare className="w-6 h-6" />, label: 'Messages' },
  { href: '/profile', icon: <User className="w-6 h-6" />, label: 'Identity' },
  { href: '/settings', icon: <Settings className="w-6 h-6" />, label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadMessagesCount, setUnreadMessagesCount } = useAppContext();
  const [localUnread, setLocalUnread] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const handleNewActivity = () => {
      if (pathname !== '/messages') {
        setLocalUnread(true);
      }
    };
    
    socket.on('message:receive', handleNewActivity);
    socket.on('reaction:add', handleNewActivity);
    
    return () => {
      socket.off('message:receive', handleNewActivity);
      socket.off('reaction:add', handleNewActivity);
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/messages') {
      setLocalUnread(false);
      setUnreadMessagesCount(0);
    }
  }, [pathname, setUnreadMessagesCount]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen border-r border-unseen-800/50 bg-[#080016]/95 backdrop-blur-md sticky top-0 py-8 px-4">
        <Link href="/feed" className="px-4 mb-10">
          <h2 className="text-2xl font-poppins font-bold text-transparent bg-clip-text bg-gradient-to-r from-unseen-200 to-unseen-400">
            UNSEEN
          </h2>
        </Link>
        <nav className="flex-1 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const isMessages = item.href === '/messages';
            const showDot = isMessages && (unreadMessagesCount > 0 || localUnread) && !isActive;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center space-x-4 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-unseen-800/50 text-white shadow-[0_0_15px_rgba(123,44,191,0.2)]'
                    : 'text-gray-400 hover:bg-unseen-900/50 hover:text-white'
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {showDot && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-unseen-400 rounded-full border-2 border-[#080016] shadow-[0_0_8px_rgba(157,78,221,0.8)]" />
                  )}
                </div>
                <span className="font-medium font-inter">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute right-0 w-1 h-8 bg-unseen-400 rounded-l-full shadow-[0_0_10px_#9d4edd]"
                  />
                )}
              </Link>
            );
          })}
        </nav>
        
        <button 
          onClick={() => router.push('/feed')}
          className="mt-auto w-full py-3 rounded-xl bg-gradient-to-r from-unseen-600 to-unseen-800 text-white font-semibold hover:shadow-[0_0_20px_rgba(123,44,191,0.6)] transition-all"
        >
          Post Thought
        </button>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full glass border-t border-unseen-800/50 z-50 flex justify-around items-center pt-4 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const isMessages = item.href === '/messages';
          const showDot = isMessages && (unreadMessagesCount > 0 || localUnread) && !isActive;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`p-2 rounded-xl transition-all relative ${
                isActive ? 'text-unseen-300' : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="relative">
                {item.icon}
                {showDot && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-unseen-400 rounded-full border-2 border-[#080016] shadow-[0_0_8px_rgba(157,78,221,0.8)]" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
