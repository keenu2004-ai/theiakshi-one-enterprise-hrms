import React, { useState } from 'react';
import { Building2, Lock, Mail, ShieldCheck, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your company email address.');
      return;
    }

    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (!res.success) {
      setError(res.message || 'Invalid email or password.');
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError(null);
    setLoading(true);
    login(quickEmail, quickPass).then((res) => {
      setLoading(false);
      if (!res.success) setError(res.message || 'Login failed.');
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md sm:max-w-lg">
        {/* Top Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-blue-600/20 text-blue-500 border border-blue-500/30 shadow-2xl mb-4 backdrop-blur-md">
            <Building2 className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            THEIAKSHI <span className="text-blue-500">ONE</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Enterprise Workforce & HR Operations Platform
          </p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Sign In</h2>
              <p className="text-xs text-slate-400">Access your employee space & dashboard</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Session Persisted</span>
            </span>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Company Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. arjun.sharma@theiakshi.com"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security password"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                />
                <span>Always stay signed in</span>
              </label>
              <span className="text-[11px] text-slate-500">Auto-saved session</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 disabled:opacity-50 transition-all mt-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In To Platform</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Secure Access Notice */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2 text-xs text-slate-400">
              <Lock className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span>Login credentials & access files are securely stored & managed by Super Admin.</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          THEIAKSHI ENTERPRISES Security Shield v4.2 • Protected Authentication Portal
        </p>
      </div>
    </div>
  );
};
