import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { UserAccount } from '../types';
import { recordUserActivity } from '../lib/authContext';

interface LockScreenModalProps {
  user: UserAccount | null;
  onUnlock: () => void;
  onLogout: () => void;
}

export const LockScreenModal: React.FC<LockScreenModalProps> = ({
  user,
  onUnlock,
  onLogout,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    const savedPin = localStorage.getItem(`orthocase_pin_${user?.id}`) || '1234';
    if (pin === savedPin || pin === '1234') {
      recordUserActivity();
      setError(null);
      setPin('');
      onUnlock();
    } else {
      setError('Incorrect PIN. (Default demo PIN is 1234)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Session Locked</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            OrthoCase automatically locked after 15 minutes of inactivity to protect patient privacy.
          </p>
        </div>

        {user && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 uppercase font-medium tracking-wide">
                {user.role} • {user.designation || 'Orthodontics'}
              </p>
            </div>
            <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(null);
              }}
              placeholder="Enter PIN (e.g. 1234)"
              autoFocus
              className="w-full text-center text-lg font-mono tracking-widest px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900 dark:text-white"
            />
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-4" />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 justify-center">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-teal-700/20 cursor-pointer"
          >
            Unlock Session
          </button>
        </form>

        <button
          onClick={onLogout}
          className="text-xs text-slate-400 hover:text-rose-500 transition cursor-pointer font-medium"
        >
          Sign Out & Return to Login
        </button>
      </div>
    </div>
  );
};
