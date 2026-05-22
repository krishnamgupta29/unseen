'use client';

import Header from '@/components/layout/Header';
import { Key, Loader2, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { auth } from '@/lib/api';

export default function SecurityPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const isStrongPassword = (pass: string) => pass.length >= 6;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!oldPassword || !newPassword) {
      setError('All fields are required.');
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await auth.changePassword(oldPassword, newPassword);
      setMessage('Password changed successfully! Keep it safe.');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Incorrect old password or update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen pb-20 bg-[#080016] text-gray-200">
      <Header title="Security Controls" showBack />

      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center gap-3 animate-fade-in shadow-lg">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs flex items-center gap-3 animate-fade-in shadow-lg">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="glass p-6 md:p-8 rounded-3xl border border-unseen-800/40 shadow-2xl relative overflow-hidden">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-unseen-800/30 rounded-lg border border-unseen-700/20">
              <Key className="w-5 h-5 text-unseen-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">Change Password</h2>
              <p className="text-[10px] text-gray-500 font-mono">Option 01: Secure Key Rotation</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-unseen-950/80 border border-unseen-800/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-unseen-500 transition-colors font-mono"
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-unseen-950/80 border border-unseen-800/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-unseen-500 transition-colors font-mono"
                placeholder="At least 6 characters"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-gradient-to-r from-unseen-600 to-unseen-850 hover:from-unseen-500 hover:to-unseen-750 transition-all rounded-xl text-xs uppercase tracking-wider font-bold text-white shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Rotate Password Key
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
