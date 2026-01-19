'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { IntroAnimation } from '@/components/IntroAnimation';
import { AuthScreen } from '@/components/AuthScreen';
import { Feed } from '@/components/Feed';
import { ProfilePage } from '@/components/ProfilePage';
import { ChatList, ChatView } from '@/components/Chat';
import { BottomNav, TopHeader, DesktopSidebar, TabletSidebar } from '@/components/Navigation';
import { CreatePostModal } from '@/components/CreatePostModal';
import { ExplorePage } from '@/components/ExplorePage';
import { SettingsPage } from '@/components/SettingsPage';
import { AppProvider, useApp } from '@/context/AppContext';
import { Conversation } from '@/lib/mock-data';

type AppState = 'intro' | 'auth' | 'app';
type Tab = 'feed' | 'explore' | 'create' | 'notifications' | 'profile' | 'messages' | 'settings';

function GeometricBackground() {
  return (
    <div className="geometric-bg">
      <div 
        className="geometric-shape animate-float-slow"
        style={{ width: '300px', height: '300px', top: '10%', left: '-5%', opacity: 0.3 }}
      />
      <div 
        className="geometric-shape animate-float"
        style={{ width: '200px', height: '200px', top: '60%', right: '-3%', opacity: 0.2 }}
      />
      <div 
        className="geometric-shape animate-float-slow"
        style={{ width: '150px', height: '150px', bottom: '20%', left: '20%', opacity: 0.15 }}
      />
    </div>
  );
}

function AppContent() {
  const { profiles, notifications, conversations, currentUser, getProfile } = useApp();
  
  const [appState, setAppState] = useState<AppState>('intro');
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const unreadMessages = conversations.reduce((acc, c) => acc + c.unread, 0);

  const handleIntroComplete = () => setAppState('auth');
  const handleLogin = () => setAppState('app');
  const handleLogout = () => {
    setAppState('auth');
    setActiveTab('feed');
  };

  const handleTabChange = (tab: Tab) => {
    if (tab === 'create') {
      setShowCreatePost(true);
    } else if (tab === 'notifications') {
    } else {
      setActiveTab(tab);
      setSelectedProfileId(null);
      setSelectedConversation(null);
    }
  };

  const handleProfileClick = (profileId: string) => {
    setSelectedProfileId(profileId);
  };

  const handleBackFromProfile = () => {
    setSelectedProfileId(null);
  };

  const handleSelectChat = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackFromChat = () => {
    setSelectedConversation(null);
  };

  const selectedProfile = selectedProfileId ? getProfile(selectedProfileId) : null;

  if (appState === 'intro') {
    return <IntroAnimation onComplete={handleIntroComplete} />;
  }

  if (appState === 'auth') {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const showFullScreenView = selectedProfile || (activeTab === 'messages' && selectedConversation) || activeTab === 'settings';
  const showMobileNav = !showFullScreenView;

  return (
    <div className="app-shell">
      <GeometricBackground />
      
      <div className="flex flex-1 relative z-10">
        <DesktopSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          messageCount={unreadMessages}
        />
        <TabletSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          messageCount={unreadMessages}
        />

        <main className="flex-1 main-content">
          <AnimatePresence mode="wait">
            {selectedProfile ? (
              <ProfilePage
                key="profile"
                profile={selectedProfile}
                onBack={handleBackFromProfile}
                onSettingsClick={() => {
                  handleBackFromProfile();
                  setActiveTab('settings');
                }}
              />
            ) : activeTab === 'messages' && selectedConversation ? (
              <div key="chat-view" className="h-screen flex flex-col">
                <ChatView
                  conversation={selectedConversation}
                  onBack={handleBackFromChat}
                />
              </div>
            ) : activeTab === 'settings' ? (
              <SettingsPage
                key="settings"
                onBack={() => setActiveTab('feed')}
                onLogout={handleLogout}
              />
            ) : (
              <div key="main">
                {activeTab !== 'messages' && (
                  <TopHeader
                    onNotificationClick={() => {}}
                    notificationCount={unreadNotifications}
                  />
                )}

                <div className="feed-container">
                  {activeTab === 'feed' && (
                    <div className="pt-4">
                      <div className="stories-scroll mb-2">
                        {profiles.slice(0, 8).map((profile) => (
                          <button
                            key={profile.id}
                            onClick={() => handleProfileClick(profile.id)}
                            className="flex flex-col items-center gap-1 flex-shrink-0 touch-target touch-feedback"
                          >
                            <div className="w-16 h-16 rounded-full bg-[#1e3a6e]/30 p-[2px]">
                              <div className={`w-full h-full rounded-full bg-gradient-to-br ${profile.avatarGradient} p-[2px]`}>
                                <div className="w-full h-full rounded-full bg-[#0d1526] flex items-center justify-center">
                                  <div className={`w-[70%] h-[70%] rounded-full bg-gradient-to-br ${profile.avatarGradient} opacity-40`} />
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-[#5a7ab0] max-w-[60px] truncate">
                              {profile.username}
                            </span>
                          </button>
                        ))}
                      </div>
                      <Feed onProfileClick={handleProfileClick} />
                    </div>
                  )}

                  {activeTab === 'explore' && (
                    <ExplorePage onProfileClick={handleProfileClick} />
                  )}

                  {activeTab === 'messages' && (
                    <ChatList onSelectChat={handleSelectChat} />
                  )}

                  {activeTab === 'profile' && (
                    <ProfilePage
                      profile={currentUser}
                      onBack={() => setActiveTab('feed')}
                      onSettingsClick={() => setActiveTab('settings')}
                    />
                  )}
                </div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {showMobileNav && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          notificationCount={unreadNotifications}
          messageCount={unreadMessages}
        />
      )}

      <AnimatePresence>
        {showCreatePost && (
          <CreatePostModal
            isOpen={showCreatePost}
            onClose={() => setShowCreatePost(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
