'use client';

import { useState, useEffect } from 'react';
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
import { Conversation } from '@/lib/types';

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
  const { profiles, notifications, conversations, currentUser, getProfile, refreshFeed } = useApp();
  
  const [appState, setAppState] = useState<AppState>('intro');
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const unreadMessages = conversations.reduce((acc, c) => acc + c.unread, 0);

  const handleIntroComplete = () => setAppState('auth');
  const handleLogin = () => setAppState('app');

  // Persistent login: once context hydrates currentUser, skip auth automatically
  useEffect(() => {
    if (!hydrated) {
      setHydrated(true);
      if (currentUser) {
        setAppState('app');
      }
    }
  }, [currentUser]);

  const handleLogout = () => {
    setAppState('auth');
    setActiveTab('feed');
  };

  const handleTabChange = (tab: Tab) => {
    if (tab === 'create') {
      setShowCreatePost(true);
    } else if (tab === 'feed' && activeTab === 'feed') {
      // Trigger feed refresh on double click from navbar
      const navItem = document.querySelector('.feed-container');
      if (navItem) {
        navItem.dispatchEvent(new CustomEvent('refreshFeed'));
      }
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
              currentUser ? (
                <SettingsPage
                  key="settings"
                  onBack={() => setActiveTab('feed')}
                  onLogout={handleLogout}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                  <p className="text-[#5a7ab0]">Please sign in to access settings</p>
                  <button 
                    onClick={handleLogout}
                    className="px-6 py-2 bg-[#1e3a6e]/40 rounded-xl text-[#7aa2e3]"
                  >
                    Sign In
                  </button>
                </div>
              )
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
                    <div 
                      className="pt-4" 
                      ref={(el) => {
                        if (el && !el.hasAttribute('data-refresh-bound')) {
                          el.setAttribute('data-refresh-bound', 'true');
                          el.addEventListener('refreshFeed', () => {
                             refreshFeed();
                          });
                        }
                      }}
                    >
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
                    currentUser ? (
                      <ProfilePage
                        profile={currentUser}
                        onBack={() => setActiveTab('feed')}
                        onSettingsClick={() => setActiveTab('settings')}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                        <p className="text-[#5a7ab0]">Please sign in to view your profile</p>
                        <button 
                          onClick={handleLogout}
                          className="px-6 py-2 bg-[#1e3a6e]/40 rounded-xl text-[#7aa2e3]"
                        >
                          Sign In
                        </button>
                      </div>
                    )
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
