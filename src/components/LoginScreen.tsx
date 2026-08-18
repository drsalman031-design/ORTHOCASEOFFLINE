import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  HelpCircle,
  Loader2,
  Plus,
  Copy,
  Check,
  Shield,
  Sparkles,
} from 'lucide-react';
import { ToothIcon } from './ToothIcon';
import { UserAccount } from '../types';
import {
  setCurrentUserAccount,
  PRESET_ACCOUNTS,
  getCachedDeptCode,
  setCachedDeptCode,
  lookupDeptCode,
  setCachedSessionToken,
} from '../lib/authContext';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = React.memo(({ onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem('orthocase_remember_me') !== 'false';
    } catch {
      return true;
    }
  });
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomGoogleForm, setShowCustomGoogleForm] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Cached Form State
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('orthocase_remembered_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [deptCode, setDeptCodeState] = useState(() => getCachedDeptCode());
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cached Department info lookup
  const deptInfo = useMemo(() => lookupDeptCode(deptCode), [deptCode]);

  const handleDeptCodeChange = useCallback((code: string) => {
    setDeptCodeState(code);
    setCachedDeptCode(code);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    // Save preferences
    try {
      localStorage.setItem('orthocase_remember_me', String(rememberMe));
      if (rememberMe && email.trim()) {
        localStorage.setItem('orthocase_remembered_email', email.trim());
      } else if (!rememberMe) {
        localStorage.removeItem('orthocase_remembered_email');
      }
      setCachedDeptCode(deptCode);
    } catch {}

    // Simulated async token generation & verification
    window.requestAnimationFrame(() => {
      setTimeout(() => {
        setSubmitting(false);
        const trimmedEmail = email.trim();
        const dummyToken = `jwt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        setCachedSessionToken(dummyToken, rememberMe);

        if (!trimmedEmail) {
          // Default to primary demo account if left blank
          const preset = PRESET_ACCOUNTS[0];
          setCurrentUserAccount(preset.id);
          onLoginSuccess(preset);
          return;
        }

        const found = PRESET_ACCOUNTS.find(
          (acc) =>
            acc.email.toLowerCase() === trimmedEmail.toLowerCase() ||
            (acc.rollNumber && acc.rollNumber.toLowerCase() === trimmedEmail.toLowerCase())
        );

        if (found) {
          setCurrentUserAccount(found.id);
          onLoginSuccess(found);
        } else {
          const newUser: UserAccount = {
            id: `usr-${Date.now()}`,
            name: trimmedEmail.split('@')[0] || 'Clinician',
            role: 'STUDENT',
            email: trimmedEmail.includes('@') ? trimmedEmail : `${trimmedEmail.toLowerCase()}@institution.edu`,
            designation: 'Resident / Clinician',
            rollNumber: trimmedEmail.includes('@') ? 'ORTHO-PG' : trimmedEmail.toUpperCase(),
            institution: deptInfo.institution || 'Department of Orthodontics & Dentofacial Orthopedics',
            department: deptInfo.name || 'Orthodontics',
          };
          setCurrentUserAccount(newUser.id, newUser);
          onLoginSuccess(newUser);
        }
      }, 250);
    });
  }, [email, rememberMe, deptCode, deptInfo, onLoginSuccess]);

  const handleGoogleAccountSelect = useCallback((googleUser: { name: string; email: string }) => {
    setGoogleLoading(true);
    setTimeout(() => {
      setGoogleLoading(false);
      setGoogleModalOpen(false);

      const dummyToken = `google-jwt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setCachedSessionToken(dummyToken, true);

      const existingPreset = PRESET_ACCOUNTS.find(
        (acc) => acc.email.toLowerCase() === googleUser.email.toLowerCase()
      );

      if (existingPreset) {
        setCurrentUserAccount(existingPreset.id);
        onLoginSuccess(existingPreset);
      } else {
        const newUser: UserAccount = {
          id: `usr-google-${Date.now()}`,
          name: googleUser.name,
          role: 'STUDENT',
          email: googleUser.email,
          designation: 'PG Resident / Orthodontist',
          rollNumber: 'ORTHO-GOOGLE-PG',
          institution: 'Department of Orthodontics & Dentofacial Orthopedics',
          department: 'Postgraduate Orthodontics',
        };
        setCurrentUserAccount(newUser.id, newUser);
        onLoginSuccess(newUser);
      }
    }, 300);
  }, [onLoginSuccess]);

  const handleCustomGoogleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) return;
    const name = customGoogleName.trim() || customGoogleEmail.split('@')[0];
    handleGoogleAccountSelect({ name, email: customGoogleEmail.trim() });
  }, [customGoogleEmail, customGoogleName, handleGoogleAccountSelect]);

  const handleForgotPasswordSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
      setForgotPasswordOpen(false);
      setResetEmail('');
    }, 1800);
  }, [resetEmail]);

  const handleCopySupportEmail = useCallback(() => {
    navigator.clipboard.writeText('it-admin.orthocase@institution.edu');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-800 flex flex-col items-center justify-between p-4 sm:p-6 font-sans relative selection:bg-blue-100">
      {/* BACKGROUND AMBIENT GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-80 bg-gradient-to-b from-blue-100/50 via-sky-50/30 to-transparent pointer-events-none rounded-b-[48px]" />

      <div className="max-w-[440px] w-full my-auto space-y-4 relative z-10 pt-4 pb-2">
        {/* CENTERED LOGIN CARD */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_12px_36px_rgba(15,23,42,0.06)] space-y-6">
          
          {/* HEADER: APP ICON & TITLE */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D52D6] to-[#1E40AF] flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/25 ring-4 ring-blue-50">
              <ToothIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Ortho Case
              </h1>
              <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto mt-0.5 leading-snug">
                Clinical Case Documentation & Academic Approval Portal
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PRIMARY SSO BUTTON: SIGN IN WITH GOOGLE */}
          <div>
            <button
              id="google-login-btn"
              type="button"
              onClick={() => setGoogleModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/90 active:bg-slate-100 text-slate-700 hover:text-slate-900 text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>

          {/* CLEAN SUBTLE SEPARATOR */}
          <div className="relative text-center py-0.5">
            <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">
              OR SIGN IN WITH EMAIL
            </span>
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-200 -z-0" />
          </div>

          {/* EMAIL / INSTITUTIONAL LOGIN FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* FIELD 1: INSTITUTIONAL EMAIL / ROLL NUMBER */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Institutional Email / Roll Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="login-email-input"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D52D6] focus:border-transparent focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* FIELD 2: PASSWORD WITH TOGGLE & FORGOT PASSWORD LINK */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  Password
                </label>
                <button
                  id="forgot-password-link"
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-xs text-[#0D52D6] hover:text-[#1E40AF] hover:underline font-semibold cursor-pointer transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D52D6] focus:border-transparent focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer rounded transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* FIELD 3: DEPARTMENT / COLLEGE CODE (COMPACT & CACHED LOOKUP) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  Department / College Code
                </label>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3" /> {deptInfo.badge || 'Cached'}
                </span>
              </div>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="login-dept-input"
                  type="text"
                  value={deptCode}
                  onChange={(e) => handleDeptCodeChange(e.target.value)}
                  placeholder="ORTHO-AC"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D52D6] focus:border-transparent focus:bg-white transition-all uppercase"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span className="truncate">{deptInfo.name}</span>
                <span className="text-[10px] text-blue-600 font-medium shrink-0 ml-2">Synced</span>
              </div>
            </div>

            {/* REMEMBER ME CHECKBOX */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  id="remember-me-checkbox"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0D52D6] focus:ring-[#0D52D6] border-slate-300 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-600">Remember Me</span>
              </label>
            </div>

            {/* PRIMARY ACTION BUTTON */}
            <button
              id="submit-login-btn"
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-2xl bg-[#0D52D6] hover:bg-[#1565C0] active:bg-[#0B44B3] text-white font-bold text-sm shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* FOOTER & SUPPORT */}
        <div className="text-center space-y-1.5 pt-1">
          <div>
            <button
              id="contact-it-admin-link"
              type="button"
              onClick={() => setSupportModalOpen(true)}
              className="text-xs font-medium text-slate-500 hover:text-[#0D52D6] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Need help? Contact IT Admin</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 font-mono tracking-wide">
            Ortho Case Portal • App Version 3.1
          </p>
        </div>
      </div>

      {/* IT ADMIN SUPPORT MODAL */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs p-4 flex items-center justify-center animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-slate-900 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0D52D6] flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Institutional IT Support</h3>
                  <p className="text-[11px] text-slate-500">Ortho Case Academic Portal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSupportModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">IT Helpdesk Email:</span>
                  <button
                    type="button"
                    onClick={handleCopySupportEmail}
                    className="text-[10px] text-[#0D52D6] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedEmail ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="text-slate-900 font-mono text-[11px] break-all bg-white p-2 rounded-xl border border-slate-200">
                  it-admin.orthocase@institution.edu
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Campus Ext</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">4092 / 4093</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Support Hours</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">08:00 - 18:00</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                For login issues, Google SSO synchronization, or department code authorization, contact your department IT administrator.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSupportModalOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
            >
              Close Support
            </button>
          </div>
        </div>
      )}

      {/* GOOGLE ACCOUNT SELECTION MODAL */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs p-4 flex items-center justify-center animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-slate-900 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <h3 className="text-sm font-bold text-slate-900">Choose an Institutional Account</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGoogleModalOpen(false);
                  setShowCustomGoogleForm(false);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {googleLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#0D52D6] animate-spin" />
                <p className="text-xs font-semibold text-slate-600">Signing in with Google SSO...</p>
              </div>
            ) : !showCustomGoogleForm ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">to continue to Ortho Case Academic Portal</p>

                {/* Primary Google User Account */}
                <button
                  type="button"
                  onClick={() =>
                    handleGoogleAccountSelect({
                      name: 'Dr. Salman',
                      email: 'drsalman031@gmail.com',
                    })
                  }
                  className="w-full p-3 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-left flex items-center gap-3 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0D52D6] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    S
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 truncate">Dr. Salman</div>
                    <div className="text-[11px] text-slate-500 truncate">drsalman031@gmail.com</div>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-[#0D52D6] font-bold px-2 py-0.5 rounded-full">
                    Primary
                  </span>
                </button>

                {/* Additional Google account option */}
                <button
                  type="button"
                  onClick={() =>
                    handleGoogleAccountSelect({
                      name: 'Dr. Rahul Sharma (Resident)',
                      email: 'rahul.sharma@institution.edu',
                    })
                  }
                  className="w-full p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-left flex items-center gap-3 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    R
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 truncate">Dr. Rahul Sharma</div>
                    <div className="text-[11px] text-slate-500 truncate">rahul.sharma@institution.edu</div>
                  </div>
                </button>

                {/* Use another account */}
                <button
                  type="button"
                  onClick={() => setShowCustomGoogleForm(true)}
                  className="w-full p-2.5 rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Use another Google account</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomGoogleSubmit} className="space-y-3">
                <p className="text-xs text-slate-600 font-medium">Enter your Google email to sign in:</p>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Your Name</label>
                  <input
                    type="text"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    placeholder="Dr. Full Name"
                    className="w-full p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-[#0D52D6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Google Email</label>
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="user@institution.edu"
                    required
                    className="w-full p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-[#0D52D6] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCustomGoogleForm(false)}
                    className="w-1/2 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-2xl bg-[#0D52D6] hover:bg-[#1565C0] text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs p-4 flex items-center justify-center animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-slate-900 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0D52D6]" /> Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600" />
                <p className="font-bold">Password Reset Link Sent!</p>
                <p className="text-[11px] text-emerald-700">Check your institutional email for instructions.</p>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <p className="text-xs text-slate-600">
                  Enter your registered institutional email to receive secure password recovery instructions:
                </p>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  required
                  className="w-full p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-[#0D52D6] focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-2xl bg-[#0D52D6] hover:bg-[#1565C0] text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Send Recovery Instructions
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

