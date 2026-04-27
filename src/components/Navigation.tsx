'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, PlusSquare, Heart, User, MessageCircle, Compass, Settings, Bell, X, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useState, useRef, useEffect } from 'react';
import { Notification, Profile } from '@/lib/mock-data';

type Tab = 'feed' | 'explore' | 'create' | 'notifications' | 'profile' | 'messages' | 'settings';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  notificationCount: number;
  messageCount: number;
}

interface DesktopSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  notificationCount: number;
  messageCount: number;
}

interface TopHeaderProps {
  onNotificationClick: () => void;
  notificationCount: number;
}

function Avatar({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const { currentUser } = useApp();
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
  };

  const avatarGradient = currentUser?.avatarGradient || 'from-violet-600 via-purple-600 to-indigo-600';

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${avatarGradient} p-[1.5px]`}>
      <div className="w-full h-full rounded-full bg-[#0d1526] flex items-center justify-center">
        <div className={`w-[70%] h-[70%] rounded-full bg-gradient-to-br ${avatarGradient} opacity-40`} />
      </div>
    </div>
  );
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
  const iconClass = 'w-3 h-3 text-white';
  const wrapperClass = 'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center';

  switch (type) {
    case 'reaction':
      return <div className={`${wrapperClass} bg-[#7aa2e3]`}><Heart className={iconClass} /></div>;
    case 'message':
      return <div className={`${wrapperClass} bg-[#4a7cc9]`}><MessageCircle className={iconClass} /></div>;
    case 'reply':
      return <div className={`${wrapperClass} bg-[#3b5ca8]`}><MessageCircle className={iconClass} /></div>;
    case 'follow':
      return <div className={`${wrapperClass} bg-[#2a4d8f]`}><User className={iconClass} /></div>;
  }
}

function NotificationDropdown({ 
  isOpen, 
  onClose, 
  onNotificationClick 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onNotificationClick: (notification: Notification) => void;
}) {
  const { notifications, markNotificationRead, markAllNotificationsRead, getProfile } = useApp();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleClick = (notification: Notification) => {
    markNotificationRead(notification.id);
    onNotificationClick(notification);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={dropdownRef}
            className="notification-dropdown scrollbar-hide"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-[#1e3a6e]/15 bg-[#0c1630]/95 backdrop-blur-sm z-10 rounded-t-xl">
              <div>
                <h3 className="font-semibold text-[#e0eaff]">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-[#7aa2e3]">{unreadCount} new</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="p-1.5 hover:bg-[#1e3a6e]/30 rounded-full transition-colors"
                    title="Mark all as read"
                  >
                    <Check className="w-4 h-4 text-[#7a9fd4]" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-[#1e3a6e]/30 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-[#7a9fd4]" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(70vh-80px)] overflow-y-auto scrollbar-hide">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-10 h-10 mx-auto mb-3 text-[#3b5998] opacity-50" />
                  <p className="text-sm text-[#5a7ab0]">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification, index) => {
                  const profile = getProfile(notification.profileId);
                  return (
                    <motion.button
                      key={notification.id}
                      onClick={() => handleClick(notification)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#142240]/40 transition-colors text-left ${
                        !notification.read ? 'bg-[#1e3a6e]/15' : ''
                      }`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <div className="relative flex-shrink-0">
                        {profile && (
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${profile.avatarGradient} p-[1.5px]`}>
                            <div className="w-full h-full rounded-full bg-[#0d1526] flex items-center justify-center">
                              <div className={`w-[70%] h-[70%] rounded-full bg-gradient-to-br ${profile.avatarGradient} opacity-40`} />
                            </div>
                          </div>
                        )}
                        <NotificationIcon type={notification.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!notification.read ? 'text-[#e0eaff]' : 'text-[#a0c4ff]'}`}>
                          {notification.content}
                        </p>
                        <p className={`text-xs mt-0.5 ${!notification.read ? 'text-[#7aa2e3]' : 'text-[#5a7ab0]'}`}>
                          {notification.timestamp}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-[#4a7cc9] flex-shrink-0" />
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function DesktopSidebar({ activeTab, onTabChange, messageCount }: Omit<DesktopSidebarProps, 'notificationCount'>) {
  const { currentUser } = useApp();
  const navItems: { id: Tab; icon: typeof Home; label: string; badge?: number }[] = [
    { id: 'feed', icon: Home, label: 'Pulse' },
    { id: 'explore', icon: Compass, label: 'Discover' },
    { id: 'messages', icon: MessageCircle, label: 'Signals', badge: messageCount },
    { id: 'create', icon: PlusSquare, label: 'Drop' },
    { id: 'profile', icon: User, label: 'Identity' },
    { id: 'settings', icon: Settings, label: 'Control' },
  ];

  return (
    <aside className="desktop-sidebar">
      <div className="p-6">
        <h1 
          className="text-2xl font-bold tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white to-[#6a00ff]"
          style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}
        >
          UNSEEN
        </h1>
        <p className="text-xs text-gray-500 mt-2 tracking-wide uppercase">Zero Identity</p>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl mb-2 transition-all duration-300 relative group overflow-hidden ${
              activeTab === id 
                ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(106,0,255,0.2)]' 
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            {activeTab === id && (
              <motion.div 
                layoutId="activeNavDesktop"
                className="absolute inset-0 bg-gradient-to-r from-[#6a00ff]/20 to-transparent border-l-2 border-[#00f0ff]"
                initial={false}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div className="relative z-10">
              <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${activeTab === id ? 'text-[#00f0ff]' : ''}`} />
              {badge && badge > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00f0ff] rounded-full animate-pulse shadow-[0_0_8px_#00f0ff]" />
              )}
            </div>
            <span className={`font-medium relative z-10 tracking-wide ${activeTab === id ? 'text-white' : ''}`}>{label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div 
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
          onClick={() => onTabChange('profile')}
        >
          <div className="group-hover:shadow-[0_0_15px_rgba(106,0,255,0.4)] rounded-full transition-shadow">
            <Avatar size="md" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate group-hover:text-[#00f0ff] transition-colors">{currentUser?.displayName || 'Anonymous Soul'}</p>
            <p className="text-xs text-gray-500 truncate">@{currentUser?.username || 'unknown'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function TabletSidebar({ activeTab, onTabChange, messageCount }: Omit<DesktopSidebarProps, 'notificationCount'>) {
  const navItems: { id: Tab; icon: typeof Home; badge?: number }[] = [
    { id: 'feed', icon: Home },
    { id: 'explore', icon: Compass },
    { id: 'messages', icon: MessageCircle, badge: messageCount },
    { id: 'create', icon: PlusSquare },
    { id: 'profile', icon: User },
    { id: 'settings', icon: Settings },
  ];

  return (
    <aside className="tablet-sidebar items-center">
      <div className="p-4 mt-2">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[#6a00ff]" style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}>U</h1>
      </div>

      <nav className="flex-1 flex flex-col items-center gap-1 px-2">
        {navItems.map(({ id, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all relative group ${
              activeTab === id 
                ? 'bg-white/10 text-[#00f0ff] shadow-[0_0_10px_rgba(106,0,255,0.2)]' 
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            {activeTab === id && (
              <motion.div 
                layoutId="activeNavTablet"
                className="absolute inset-0 bg-gradient-to-tr from-[#6a00ff]/20 to-transparent rounded-xl border border-white/10"
                initial={false}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
              <Icon className="w-5 h-5" />
              {badge && badge > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#00f0ff] rounded-full animate-pulse shadow-[0_0_8px_#00f0ff]" />
              )}
            </div>
          </button>
        ))}
      </nav>

      <div className="p-4 mb-4">
        <Avatar size="md" />
      </div>
    </aside>
  );
}

export function BottomNav({ activeTab, onTabChange, notificationCount, messageCount }: BottomNavProps) {
  const tabs: { id: Tab; icon: typeof Home; label: string }[] = [
    { id: 'feed', icon: Home, label: 'Pulse' },
    { id: 'explore', icon: Compass, label: 'Discover' },
    { id: 'create', icon: PlusSquare, label: 'Drop' },
    { id: 'messages', icon: MessageCircle, label: 'Signals' },
    { id: 'profile', icon: User, label: 'Identity' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {tabs.map(({ id, icon: Icon, label }) => (
            <motion.button
              key={id}
              onClick={() => onTabChange(id)}
              className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[60px] ${
                activeTab === id ? 'text-[#00f0ff]' : 'text-gray-500 hover:text-gray-300'
              }`}
              whileTap={{ scale: 0.9 }}

            >
              {id === 'create' ? (
                <div className="w-12 h-10 rounded-xl bg-gradient-to-r from-[#6a00ff] to-[#ff00ea] flex items-center justify-center shadow-[0_0_15px_rgba(106,0,255,0.4)]">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              ) : id === 'profile' ? (
                <div className={`p-0.5 rounded-full transition-all ${activeTab === id ? 'ring-2 ring-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.3)]' : ''}`}>
                  <Avatar />
                </div>
              ) : (
                <div className="relative">
                  <Icon className={`w-6 h-6 ${activeTab === id ? 'text-[#00f0ff]' : ''}`} />
                  {id === 'messages' && messageCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00f0ff] rounded-full animate-pulse shadow-[0_0_8px_#00f0ff]" />
                  )}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </nav>
  );
}

export function TopHeader({ onNotificationClick, notificationCount }: TopHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { markNotificationRead } = useApp();

  const handleNotificationClick = (notification: Notification) => {
    markNotificationRead(notification.id);
    onNotificationClick();
  };

  return (
    <>
      <header className="top-header">
        <div className="top-header-inner px-4 py-3 flex items-center justify-between">
          {!isSearchExpanded && (
            <h1 
              className="text-xl font-bold tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white to-[#6a00ff]"
              style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}
            >
              UNSEEN
            </h1>
          )}
          
          <div className={`flex items-center gap-2 ${isSearchExpanded ? 'w-full' : ''}`}>
            <AnimatePresence>
              {isSearchExpanded ? (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: '100%' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 flex items-center relative"
                >
                  <Search className="w-4 h-4 absolute left-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search the unseen..."
                    className="w-full bg-black/40 border border-[#6a00ff]/30 focus:border-[#00f0ff] rounded-full py-1.5 pl-9 pr-8 text-sm text-white focus:outline-none transition-colors hidden md:block lg:block sm:block xs:block"
                    autoFocus
                  />
                  <button 
                    onClick={() => setIsSearchExpanded(false)}
                    className="absolute right-2 p-1 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <button 
                  onClick={() => setIsSearchExpanded(true)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Search className="w-5 h-5 text-gray-400 hover:text-[#00f0ff] transition-colors" />
                </button>
              )}
            </AnimatePresence>

            {!isSearchExpanded && (
              <motion.button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors relative"
                whileTap={{ scale: 0.9 }}
              >
                <Bell className="w-5 h-5 text-gray-400 hover:text-[#00f0ff] transition-colors" />
                {notificationCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#00f0ff] rounded-full animate-pulse shadow-[0_0_8px_#00f0ff]" />
                )}
              </motion.button>
            )}
          </div>
        </div>
      </header>
      <NotificationDropdown
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNotificationClick={handleNotificationClick}
      />
    </>
  );
}
