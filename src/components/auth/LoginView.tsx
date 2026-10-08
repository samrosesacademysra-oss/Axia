import React, { useState } from 'react';
import { Database, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase/client';

export function LoginView() {
  const { signIn, isSupabaseAuth } = useAuth();
  const [email, setEmail] = useState('admin@axiadistributions.com');
  const [password, setPassword] = useState('admin123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
    }
    setSubmitting(false);
  };

  const handleQuickDemoLogin = async () => {
    setError(null);
    setSubmitting(true);
    await signIn('admin@axiadistributions.com', 'admin123');
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-stone-200/90 rounded-2xl shadow-xl p-8 space-y-6">
        {/* Brand Logo & Name */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-stone-900 text-white rounded-xl flex items-center justify-center font-bold text-lg mx-auto shadow-md">
            AX
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            Axia Distributions
          </h1>
          <p className="text-xs text-stone-500">
            Internal Inventory &amp; Sales Management System
          </p>
        </div>

        {/* Supabase backend status banner */}
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between text-stone-600">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-stone-500" />
            <span>Infrastructure:</span>
          </div>
          <span className="font-semibold text-stone-900">
            {isSupabaseConfigured ? 'Supabase Auth' : 'Supabase-Ready (Cursor)'}
          </span>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@axiadistributions.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
          >
            {submitting ? 'Authenticating...' : 'Sign In to Admin Portal'}
          </button>
        </form>

        <div className="pt-2 border-t border-stone-100 text-center">
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="text-xs text-stone-500 hover:text-stone-900 inline-flex items-center gap-1.5 transition-colors font-medium"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Quick Sign In as Kwame Mensah (Admin)
          </button>
        </div>
      </div>

      <p className="text-[11px] text-stone-400 text-center mt-6">
        Axia Distributions • Personal Care, Fragrances &amp; Diffusers
      </p>
    </div>
  );
}
