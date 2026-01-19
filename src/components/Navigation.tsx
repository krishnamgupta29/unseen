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

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${currentUser.avatarGradient} p-[1.5px]`}>
      <div className="w-full h-full rounded-full bg-[#0d1526] flex items-center justify-center">
        <div className={`w-[70%] h-[70%] rounded-full bg-gradient-to-br ${currentUser.avatarGradient} opacity-40`} />
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
  const navItems: { id: Tab; icon: typeof Home; label: string; badge?: number }[] = [
    { id: 'feed', icon: Home, label: 'Home' },
    { id: 'explore', icon: Compass, label: 'Explore' },
    { id: 'messages', icon: MessageCircle, label: 'Messages', badge: messageCount },
    { id: 'create', icon: PlusSquare, label: 'Create' },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="desktop-sidebar">
      <div className="p-6">
        <h1 
          className="text-2xl font-semibold tracking-[0.15em] gradient-text"
          style={{ fontFamily: "'Literata', Georgia, serif" }}
        >
          UNSEEN
        </h1>
        <p className="text-xs text-[#5a7ab0] mt-1">Say it. Without being seen.</p>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl mb-1 transition-all ${
              activeTab === id 
                ? 'bg-[#1e3a6e]/40 text-[#7aa2e3]' 
                : 'text-[#7a9fd4] hover:bg-[#142240]/40 hover:text-[#a0c4ff]'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${activeTab === id ? 'text-[#7aa2e3]' : ''}`} />
              {badge && badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4a7cc9] text-white rounded-full text-[10px] font-medium flex items-center justify-center">
                  {badge}
                </span>
              )}
            </div>
            <span className={`font-medium ${activeTab === id ? 'text-[#e0eaff]' : ''}`}>{label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#1e3a6e]/15">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#142240]/40 transition-colors cursor-pointer">
          <Avatar size="md" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#e0eaff]">@chuppi_todunga</p>
            <p className="text-xs text-[#5a7ab0]">Anonymous</p>
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
        <h1 className="text-lg font-semibold text-[#7aa2e3]" style={{ fontFamily: "'Literata', Georgia, serif" }}>U</h1>
      </div>

      <nav className="flex-1 flex flex-col items-center gap-1 px-2">
        {navItems.map(({ id, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${
              activeTab === id 
                ? 'bg-[#1e3a6e]/40 text-[#7aa2e3]' 
                : 'text-[#7a9fd4] hover:bg-[#142240]/40 hover:text-[#a0c4ff]'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {badge && badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4a7cc9] text-white rounded-full text-[10px] font-medium flex items-center justify-center">
                  {badge}
                </span>
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
    { id: 'feed', icon: Home, label: 'Home' },
    { id: 'explore', icon: Compass, label: 'Explore' },
    { id: 'create', icon: PlusSquare, label: 'Create' },
    { id: 'messages', icon: MessageCircle, label: 'Messages' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {tabs.map(({ id, icon: Icon, label }) => (
            <motion.button
              key={id}
              onClick={() => onTabChange(id)}
              className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                activeTab === id ? 'text-[#7aa2e3]' : 'text-[#5a7ab0] hover:text-[#7a9fd4]'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {id === 'create' ? (
                <div className="w-10 h-8 rounded-lg bg-gradient-to-r from-[#3b5ca8] to-[#4a7cc9] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              ) : id === 'profile' ? (
                <div className={`p-0.5 rounded-full ${activeTab === id ? 'ring-2 ring-[#4a7cc9]' : ''}`}>
                  <Avatar />
                </div>
              ) : (
                <div className="relative">
                  <Icon className={`w-6 h-6 ${activeTab === id ? 'text-[#7aa2e3]' : ''}`} />
                  {id === 'messages' && messageCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4a7cc9] text-white rounded-full text-[10px] font-medium flex items-center justify-center">
                      {messageCount}
                    </span>
                  )}
                </div>
              )}
              <span className="text-[10px]">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </nav>
  );
}

export function TopHeader({ onNotificationClick, notificationCount }: TopHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { markNotificationRead } = useApp();

  const handleNotificationClick = (notification: Notification) => {
    markNotificationRead(notification.id);
    onNotificationClick();
  };

  return (
    <>
      <header className="top-header">
        <div className="top-header-inner px-4 py-3 flex items-center justify-between">
          <h1 
            className="text-xl font-semibold tracking-[0.1em] gradient-text"
            style={{ fontFamily: "'Literata', Georgia, serif" }}
          >
            UNSEEN
          </h1>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[#1e3a6e]/30 rounded-full transition-colors">
              <Search className="w-5 h-5 text-[#7a9fd4]" />
            </button>
            <motion.button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-[#1e3a6e]/30 rounded-full transition-colors relative"
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-5 h-5 text-[#7a9fd4]" />
              {notificationCount > 0 && (
                <motion.span 
                  className="absolute top-1 right-1 w-4 h-4 bg-[#4a7cc9] text-white rounded-full text-[10px] font-medium flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                >
                  {notificationCount}
                </motion.span>
              )}
            </motion.button>
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
