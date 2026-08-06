import React, { useState } from 'react';
import {
  Stethoscope,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Fingerprint,
  Building2,
  HelpCircle,
  BadgeCheck,
  GraduationCap,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { AppUserRole, UserAccount } from '../types';
import { setCurrentUserAccount, PRESET_ACCOUNTS } from '../lib/authContext';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [activeRole, setActiveRole] = useState<AppUserRole>('STUDENT');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [biometricsLoading, setBiometricsLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [deptCode, setDeptCode] = useState('ORTHO-AC');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic portal title
  const portalTitle =
    activeRole === 'STUDENT'
      ? 'Resident Login'
      : activeRole === 'STAFF_GUIDE'
      ? 'Faculty Console'
      : 'HOD Portal Login';

  const portalSubtitle =
    activeRole === 'STUDENT'
      ? 'Access case records, logs & submit treatment plans'
      : activeRole === 'STAFF_GUIDE'
      ? 'Review postgraduate submissions & guide clinical cases'
      : 'Departmental overview, HOD approvals & faculty oversight';

  // Find demo account for selected role or create user
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      // Auto-fill from preset for selected role
      const preset = PRESET_ACCOUNTS.find((acc) => acc.role === activeRole) || PRESET_ACCOUNTS[0];
      setCurrentUserAccount(preset.id);
      onLoginSuccess(preset);
      return;
    }

    const found = PRESET_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === email.toLowerCase() && acc.role === activeRole
    );
    if (found) {
      setCurrentUserAccount(found.id);
      onLoginSuccess(found);
    } else {
      const newUser: UserAccount = {
        id: `usr-${Date.now()}`,
        name: email.split('@')[0] || 'User',
        role: activeRole,
        email: email,
        designation:
          activeRole === 'STUDENT'
            ? 'PG Resident (Y2)'
            : activeRole === 'STAFF_GUIDE'
            ? 'Assistant Professor & Guide'
            : 'Head of Department',
        institution: 'Department of Orthodontics',
        department: 'Orthodontics & Dentofacial Orthopedics',
      };
      setCurrentUserAccount(newUser.id);
      onLoginSuccess(newUser);
    }
  };

  const handleDemoSelect = (account: UserAccount) => {
    setActiveRole(account.role);
    setEmail(account.email);
    setCurrentUserAccount(account.id);
    onLoginSuccess(account);
  };

  const handleBiometrics = () => {
    setBiometricsLoading(true);
    setTimeout(() => {
      setBiometricsLoading(false);
      const preset = PRESET_ACCOUNTS.find((acc) => acc.role === activeRole) || PRESET_ACCOUNTS[0];
      setCurrentUserAccount(preset.id);
      onLoginSuccess(preset);
    }, 1200);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
      setForgotPasswordOpen(false);
      setResetEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-slate-800 flex flex-col items-center justify-between p-4 sm:p-6 font-sans relative">
      {/* DECORATIVE AMBIENT BACKGROUND */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-gradient-to-b from-blue-100/60 to-transparent pointer-events-none rounded-b-3xl" />

      <div className="max-w-md w-full my-auto space-y-5 relative z-10 pt-2">
        {/* TOP BRAND HEADER */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0D52D6] to-[#1565C0] flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <Stethoscope className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-1.5">
              <span>Ortho</span>
              <span className="text-[#0D52D6]">Sync</span>
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Academic & Clinical Case Approval Portal
            </p>
          </div>
        </div>

        {/* SEGMENTED ROLE SWITCHER TAB BAR */}
        <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center justify-between gap-1 border border-slate-300/60 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveRole('STUDENT')}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeRole === 'STUDENT'
                ? 'bg-[#0D52D6] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Resident</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole('STAFF_GUIDE')}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeRole === 'STAFF_GUIDE'
                ? 'bg-[#0D52D6] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Faculty</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole('HOD')}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeRole === 'HOD'
                ? 'bg-[#0D52D6] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>HOD</span>
          </button>
        </div>

        {/* INPUT FORM CARD */}
        <div className="bg-white border border-[#E5E8F0] rounded-3xl p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>{portalTitle}</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-[#0D52D6] border border-blue-200">
                {activeRole === 'STUDENT' ? 'PG RESIDENT' : activeRole === 'STAFF_GUIDE' ? 'GUIDE' : 'ADMIN'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{portalSubtitle}</p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Institutional Email / Roll Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    activeRole === 'STUDENT'
                      ? 'e.g. rahul.sharma@institution.edu or ORTHO-2024-PG-01'
                      : activeRole === 'STAFF_GUIDE'
                      ? 'e.g. sunita.patil@institution.edu'
                      : 'e.g. hod.ortho@institution.edu'
                  }
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D52D6] focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">Password</label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-xs text-[#0D52D6] hover:underline font-bold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D52D6] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Department / College Code
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="ORTHO-AC"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#0D52D6] focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0D52D6] focus:ring-[#0D52D6] border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-600">Remember Me</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#0D52D6] hover:bg-[#1565C0] text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* SSO & BIOMETRICS SECTION */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="relative text-center">
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative z-10">
                Or Sign In With
              </span>
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-200 -z-0" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const preset = PRESET_ACCOUNTS.find((acc) => acc.role === activeRole) || PRESET_ACCOUNTS[0];
                  setCurrentUserAccount(preset.id);
                  onLoginSuccess(preset);
                }}
                className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z"
                  />
                </svg>
                <span>Google Workspace</span>
              </button>

              <button
                type="button"
                onClick={handleBiometrics}
                disabled={biometricsLoading}
                className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Fingerprint className="w-4 h-4 text-[#0D52D6]" />
                <span>{biometricsLoading ? 'Verifying...' : 'Biometrics'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* DEMO ACCOUNTS QUICK SWITCHER */}
        <div className="bg-white border border-[#E5E8F0] rounded-2xl p-3.5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#0D52D6]" />
              Quick Demo Accounts
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
              Click to Auto-login
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PRESET_ACCOUNTS.slice(0, 3).map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleDemoSelect(acc)}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  activeRole === acc.role
                    ? 'bg-blue-50/70 border-blue-200 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-xs truncate">{acc.name.split(' ')[1] || acc.name}</div>
                <div className="text-[10px] text-[#0D52D6] font-semibold">{acc.role}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-3 text-center space-y-1 relative z-10">
        <div className="flex items-center justify-center gap-3 text-xs font-medium text-slate-500">
          <a
            href="#help"
            onClick={(e) => {
              e.preventDefault();
              alert('Support contact: support.orthosync@institution.edu | IT Ext: 4092');
            }}
            className="hover:text-[#0D52D6] flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Need help? Contact IT Admin</span>
          </a>
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          OrthoSync Academic Portal • App Version 3.0.2
        </div>
      </footer>

      {/* FORGOT PASSWORD MODAL */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs p-4 flex items-center justify-center animate-fadeIn">
          <div className="bg-white border border-[#E5E8F0] rounded-3xl max-w-sm w-full p-6 text-slate-900 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0D52D6]" /> Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600" />
                <p className="font-bold">Password Reset Link Sent!</p>
                <p className="text-[11px] text-emerald-700">Check your email inbox for instructions.</p>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <p className="text-xs text-slate-600">
                  Enter your registered institutional email to receive a password reset link:
                </p>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your.name@institution.edu"
                  required
                  className="w-full p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-[#0D52D6] focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-2xl bg-[#0D52D6] hover:bg-[#1565C0] text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Send Reset Instructions
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
