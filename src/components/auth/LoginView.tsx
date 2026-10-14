import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function ParticleWave() {
  const dots = useMemo(() => {
    const points: { x: number; y: number; r: number; o: number }[] = [];
    const cols = 56;
    const rows = 36;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const nx = col / (cols - 1);
        const ny = row / (rows - 1);
        const wave = 0.5 + Math.sin(nx * Math.PI * 2.6 + 0.4) * 0.16 + Math.sin(nx * Math.PI * 5.2) * 0.04;
        const dist = Math.abs(ny - wave);
        if (dist > 0.2) continue;
        const fade = 1 - dist / 0.2;
        points.push({
          x: 8 + nx * 84,
          y: 12 + ny * 70,
          r: dist < 0.035 ? 1.15 : 0.72,
          o: 0.18 + fade * 0.82,
        });
      }
    }
    return points;
  }, []);

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {dots.map((dot, index) => (
        <circle key={index} cx={dot.x} cy={dot.y} r={dot.r * 0.42} fill="white" opacity={dot.o} />
      ))}
    </svg>
  );
}

export function LoginView() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('admin@axiadistributions.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
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
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-10"
      style={{
        backgroundColor: '#050505',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.28) 1px, transparent 1.2px)',
        backgroundSize: '16px 16px',
      }}
    >
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:grid-cols-2">
        <div className="px-8 py-10 sm:px-12 sm:py-14">
          <h1 className="text-[28px] font-semibold tracking-tight text-neutral-950">Welcome Back !</h1>
          <p className="mt-1 text-sm text-neutral-400">Please enter your details</p>

          {error && (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm text-neutral-500" htmlFor="email">
                Username / Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-300 focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-500" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 pr-11 text-sm text-neutral-900 outline-none placeholder:text-neutral-300 focus:border-neutral-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-full bg-neutral-950 py-3.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-950 disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" />
            Continue as Samuel Nyamekye
          </button>
        </div>

        <div className="relative hidden min-h-[560px] bg-black md:block">
          <ParticleWave />
          <div className="absolute inset-x-0 bottom-16 text-center">
            <p className="text-2xl font-medium tracking-tight text-white">Axia Distributions</p>
            <div className="mt-4 flex items-center justify-center gap-2 text-white/70">
              <span className="h-px w-6 bg-white/70" />
              <span className="h-px w-6 bg-white/40" />
              <span className="h-px w-6 bg-white/25" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
