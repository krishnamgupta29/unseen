'use client';

import { motion } from 'framer-motion';
import { Heart, MessageCircle, UserPlus, MessageSquare, X, Check, Lock } from 'lucide-react';
import { Notification, Profile } from '@/lib/mock-data';
import { useApp } from '@/context/AppContext';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick: (notification: Notification) => void;
}

function Avatar({ profile, size = 'sm' }: { profile: Profile; size?: 'sm' | 'md' }) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${profile.avatarGradient} p-[2px] flex-shrink-0`}>
      <div className="w-full h-full rounded-full bg-[#0d1526] flex items-center justify-center">
        <div className={`w-[70%] h-[70%] rounded-full bg-gradient-to-br ${profile.avatarGradient} opacity-40 blur-[1px]`} />
      </div>
    </div>
  );
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
  const iconClass = 'w-3.5 h-3.5';
  const wrapperClass = 'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center';

  switch (type) {
    case 'reaction':
      return (
        <div className={`${wrapperClass} bg-[#7aa2e3]`}>
          <Heart className={iconClass} />
        </div>
      );
    case 'message':
      return (
        <div className={`${wrapperClass} bg-[#4a7cc9]`}>
          <MessageCircle className={iconClass} />
        </div>
      );
    case 'reply':
      return (
        <div className={`${wrapperClass} bg-[#3b5ca8]`}>
          <MessageSquare className={iconClass} />
        </div>
      );
    case 'follow':
      return (
        <div className={`${wrapperClass} bg-[#2a4d8f]`}>
          <UserPlus className={iconClass} />
        </div>
      );
  }
}

function NotificationItem({ 
  notification, 
  index,
  onClick,
}: { 
  notification: Notification; 
  index: number;
  onClick: () => void;
}) {
  const { getProfile, markNotificationRead } = useApp();
  const profile = getProfile(notification.profileId);
  
  if (!profile) return null;

  const handleClick = () => {
    markNotificationRead(notification.id);
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-[#142240]/30 transition-colors text-left ${
        !notification.read ? 'bg-[#1e3a6e]/15' : ''
      }`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="relative">
        <Avatar profile={profile} />
        <NotificationIcon type={notification.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed ${!notification.read ? 'text-[#e0eaff]' : 'text-[#a0c4ff]'}`}>
          {notification.content}
        </p>
        <p className={`text-xs mt-1 ${!notification.read ? 'text-[#7aa2e3]' : 'text-[#3b5998]'}`}>
          {notification.timestamp}
        </p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-[#4a7cc9] flex-shrink-0" />
      )}
    </motion.button>
  );
}

export function NotificationsPanel({ isOpen, onClose, onNotificationClick }: NotificationsPanelProps) {
  const { notifications, markAllNotificationsRead } = useApp();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-[#0a0f1c]/50 z-40 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}
      <motion.div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0f1c] border-l border-[#1e3a6e]/15 z-50`}
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#1e3a6e]/15">
          <div>
            <h2 className="text-lg font-semibold text-[#e0eaff]">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-[#7aa2e3]">{unreadCount} new</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="p-2 hover:bg-[#1e3a6e]/30 rounded-full transition-colors"
                title="Mark all as read"
              >
                <Check className="w-5 h-5 text-[#7a9fd4]" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#1e3a6e]/30 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-[#7a9fd4]" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100%-140px)] scrollbar-hide">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#5a7ab0]">
              <Heart className="w-12 h-12 mb-4 opacity-30" />
              <p>No notifications yet</p>
              <p className="text-sm text-[#3b5998] mt-1">Your activity will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1e3a6e]/10">
              {notifications.map((notification, index) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                  index={index}
                  onClick={() => onNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#1e3a6e]/15 bg-[#0a0f1c]">
          <p className="text-xs text-[#3b5998] text-center flex items-center justify-center gap-2">
            <Lock className="w-3 h-3" />
            All interactions are anonymous
          </p>
        </div>
      </motion.div>
    </>
  );
}
