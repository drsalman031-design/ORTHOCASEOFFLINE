import React, { useState, useMemo, useCallback } from 'react';
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
  Loader2,
  Check,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { UserAccount } from '../types';
import {
  setSecureAuthSession,
  getCachedDeptCode,
  setCachedDeptCode,
  lookupDeptCode,
  setCachedSessionToken,
  authenticateUserLocally,
  resetUserPasswordLocally,
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

  // State
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cached Form State (Institutional Email / Roll Number)
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('orthocase_remembered_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [deptCode, setDeptCodeState] = useState(() => getCachedDeptCode());

  // Forgot Password / Offline Recovery Form State
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetRecoveryCode, setResetRecoveryCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Department info lookups
  const deptInfo = useMemo(() => lookupDeptCode(deptCode), [deptCode]);

  const handleDeptCodeChange = useCallback((code: string) => {
    setDeptCodeState(code);
    setCachedDeptCode(code);
  }, []);

  /**
   * Offline-First Local Authentication Handler:
   * Validates credentials directly against the local device database without requiring internet access.
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);
      setSubmitting(true);

      try {
        localStorage.setItem('orthocase_remember_me', String(rememberMe));
        if (rememberMe && email.trim()) {
          localStorage.setItem('orthocase_remembered_email', email.trim());
        } else if (!rememberMe) {
          localStorage.removeItem('orthocase_remembered_email');
        }
        setCachedDeptCode(deptCode);
      } catch {}

      window.requestAnimationFrame(() => {
        setTimeout(() => {
          setSubmitting(false);
          const result = authenticateUserLocally(email, password, deptCode);

          if (!result.success || !result.user) {
            setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
            return;
          }

          const sessionToken = `jwt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          setCachedSessionToken(sessionToken, rememberMe);

          const persistedUser = setSecureAuthSession(result.user, sessionToken, 'institutional');
          onLoginSuccess(persistedUser);
        }, 200);
      });
    },
    [email, password, rememberMe, deptCode, onLoginSuccess]
  );

  /**
   * Offline Local Password Recovery Handler:
   * Verifies Department Code / Master Recovery Key and updates credentials locally.
   */
  const handleResetPasswordSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setResetError(null);
      setResetSuccessMsg(null);

      if (!resetIdentifier.trim()) {
        setResetError('Please enter your registered email or roll number.');
        return;
      }
      if (!resetRecoveryCode.trim()) {
        setResetError('Please enter your Department Recovery Code or Master Key (e.g. ORTHO-2026).');
        return;
      }
      if (!resetNewPassword || resetNewPassword.length < 4) {
        setResetError('New password must be at least 4 characters long.');
        return;
      }

      const result = resetUserPasswordLocally(
        resetIdentifier.trim(),
        resetRecoveryCode.trim(),
        resetNewPassword
      );

      if (!result.success) {
        setResetError(result.message);
        return;
      }

      setResetSuccessMsg(result.message);
      // Auto populate the login fields with the newly set password
      setEmail(resetIdentifier.trim());
      setPassword(resetNewPassword);

      setTimeout(() => {
        setForgotPasswordOpen(false);
        setResetSuccessMsg(null);
        setResetError(null);
        setResetIdentifier('');
        setResetRecoveryCode('');
        setResetNewPassword('');
      }, 1500);
    },
    [resetIdentifier, resetRecoveryCode, resetNewPassword]
  );

  return (
    <div
      className="min-h-[100dvh] h-full w-full bg-[#F4F6FB] text-slate-800 flex flex-col items-center justify-between p-4 sm:p-6 font-sans relative selection:bg-blue-100 overflow-y-auto overflow-x-hidden"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
      }}
    >
      {/* BACKGROUND AMBIENT GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-80 bg-gradient-to-b from-blue-100/50 via-sky-50/30 to-transparent pointer-events-none rounded-b-[48px]" />

      <div className="max-w-[440px] w-full my-auto space-y-4 relative z-10 pt-4 pb-2">
        {/* CENTERED LOGIN CARD */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_12px_36px_rgba(15,23,42,0.06)] space-y-6">
          
          {/* HEADER: APP ICON & TITLE */}
          <div className="text-center space-y-3">
            <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-xl ring-4 ring-slate-100">
              <img
                src="/app-logo.jpg"
                alt="OrthoCase Launch Logo"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#071B49]">
                OrthoCase
              </h1>
              <p className="text-sm font-semibold text-slate-700 max-w-xs mx-auto mt-0.5 tracking-wide">
                Case Recording & Tracking
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Postgraduate Orthodontic Clinical Logbook
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STREAMLINED EMAIL / INSTITUTIONAL LOGIN FORM */}
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
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.edu or ORTHO-PG-01"
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
                  onClick={() => {
                    setResetIdentifier(email);
                    setForgotPasswordOpen(true);
                  }}
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
                  required
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

            {/* FIELD 3: DEPARTMENT / COLLEGE CODE (WITH ACADEMIC VERIFIED BADGE) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  Department / College Code
                </label>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3" /> {deptInfo.badge || 'Academic Verified'}
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
                <span className="text-[10px] text-blue-600 font-medium shrink-0 ml-2">Offline Ready</span>
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
              className="w-full py-3.5 px-4 rounded-2xl bg-[#0D52D6] hover:bg-[#1565C0] active:bg-[#0B44B3] text-white font-bold text-sm shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In to Portal...</span>
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

        {/* FOOTER CREDITS */}
        <div className="text-center pt-3 pb-1 px-2 space-y-1">
          <p className="text-xs text-slate-500 font-medium">
            Developed by <strong className="text-slate-800 font-bold whitespace-nowrap">Dr. Salman, MDS Orthodontist</strong>
          </p>
          <p className="text-xs text-slate-500 font-medium">
            in collaboration with <strong className="text-slate-800 font-bold whitespace-nowrap">Dr. Raghu Devanna</strong> and <strong className="text-slate-800 font-bold whitespace-nowrap">Dr. K. Srinivas Karnam</strong>
          </p>
        </div>
      </div>

      {/* OFFLINE LOCAL CREDENTIAL RECOVERY & PIN RESET MODAL */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs p-4 flex items-center justify-center animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-slate-900 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#0D52D6]" /> Local Credential Recovery
              </h3>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-1.5 animate-in fade-in">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600" />
                <p className="font-bold">Password Reset Successful!</p>
                <p className="text-[11px] text-emerald-700">{resetSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                <p className="text-xs text-slate-600">
                  Reset your password locally in the clinic database without internet connectivity:
                </p>

                {resetError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Institutional Email / Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    placeholder="name@institution.edu or roll number"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-[#0D52D6] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Department Recovery Code
                    </label>
                    <span className="text-[10px] text-slate-400">Default: ORTHO-2026</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={resetRecoveryCode}
                    onChange={(e) => setResetRecoveryCode(e.target.value.toUpperCase())}
                    placeholder="ORTHO-2026"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-[#0D52D6] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    New Local Password
                  </label>
                  <input
                    type="password"
                    required
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-[#0D52D6] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#0D52D6] hover:bg-[#1565C0] text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                >
                  Reset & Save New Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
});


