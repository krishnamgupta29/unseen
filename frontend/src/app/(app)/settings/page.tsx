'use client';

import { Shield, Info, LogOut, Key, ChevronLeft, Trash2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

export default function SettingsPage() {
  const router = useRouter();
  const { currentUser, logout } = useAppContext();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-full min-h-screen">
      <Header title="Settings" />

      <div className="p-6">
        <div className="glass rounded-2xl border border-unseen-800/50 overflow-hidden">
          
          <div className="p-6 border-b border-unseen-800/50 flex items-center space-x-4 bg-unseen-900/30">
             <div className="relative flex-shrink-0">
               <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${currentUser?.avatarColor || 'from-unseen-400 to-unseen-700'} blur-lg opacity-60`} />
               <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${currentUser?.avatarColor || 'from-unseen-400 to-unseen-700'} border-4 border-[#080016]`}>
                 {/* Pure colored orb */}
               </div>
             </div>
              <div>
                <h2 className="text-xl font-bold text-white">{currentUser?.displayName}</h2>
                <p className="text-unseen-400 font-mono text-sm">@{currentUser?.username}</p>
              </div>
          </div>

          <div className="p-2 space-y-1">
            <button 
              onClick={() => router.push('/settings/security')}
              className="w-full flex items-center p-4 rounded-xl hover:bg-unseen-800/50 text-gray-300 hover:text-white transition-colors text-left"
            >
              <Key className="w-5 h-5 mr-4 text-unseen-400" />
              <span>Security & Password</span>
            </button>
            <button 
              onClick={() => router.push('/settings/privacy')}
              className="w-full flex items-center p-4 rounded-xl hover:bg-unseen-800/50 text-gray-300 hover:text-white transition-colors text-left"
            >
              <Shield className="w-5 h-5 mr-4 text-unseen-400" />
              <span>Privacy Policy</span>
            </button>
            <button 
              onClick={() => router.push('/settings/about')}
              className="w-full flex items-center p-4 rounded-xl hover:bg-unseen-800/50 text-gray-300 hover:text-white transition-colors text-left"
            >
              <Info className="w-5 h-5 mr-4 text-unseen-400" />
              <span>About Unseen</span>
            </button>
            
            <div className="h-px bg-unseen-800/50 my-2 mx-4" />
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center p-4 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors text-left"
            >
              <LogOut className="w-5 h-5 mr-4" />
              <span>Log Out</span>
            </button>
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to permanently delete your identity? This cannot be undone.')) {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  router.push('/login');
                }
              }}
              className="w-full flex items-center p-4 rounded-xl hover:bg-red-500/20 bg-red-500/5 text-red-500 transition-colors text-left mt-2"
            >
              <Trash2 className="w-5 h-5 mr-4" />
              <span className="font-semibold">Delete Identity</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
