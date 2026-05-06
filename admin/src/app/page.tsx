'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-gutter">
      {/* Branding */}
      <header className="mb-lg text-center">
        <div className="flex items-center justify-center gap-xs mb-xs">
          <span className="material-symbols-outlined text-primary text-3xl">school</span>
          <span className="text-3xl font-black tracking-tighter text-primary">ExamPulse</span>
        </div>
        <p className="text-label-caps text-outline uppercase tracking-[0.2em]">Admin Portal</p>
      </header>

      {/* Login Card */}
      <main className="w-full max-w-[420px]">
        <div className="bg-surface-container-lowest border border-outline-variant p-lg shadow-sm rounded-lg">
          <div className="mb-md">
            <h1 className="text-headline-md font-semibold text-primary mb-xs">Administrator Login</h1>
            <p className="text-body-md text-on-surface-variant">Access the ExamPulse admin dashboard.</p>
          </div>

          {error && (
            <div className="mb-md p-sm bg-error-container text-error rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-md">
            <div className="space-y-xs">
              <label className="font-label-caps text-on-surface uppercase block text-xs font-semibold tracking-wider">
                Email Address
              </label>
              <div className="relative group">
                <input
                  className="w-full h-12 bg-white border border-outline px-sm text-body-md focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim outline-none transition-all duration-200 rounded"
                  type="email"
                  placeholder="admin@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-xs">
              <label className="font-label-caps text-on-surface uppercase block text-xs font-semibold tracking-wider">
                Password
              </label>
              <div className="relative group">
                <input
                  className="w-full h-12 bg-white border border-outline px-sm text-body-md focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim outline-none transition-all duration-200 rounded"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary font-semibold h-14 flex items-center justify-center gap-sm active:scale-[0.98] transition-transform duration-150 rounded disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
            </button>
          </form>
        </div>

        <footer className="mt-md text-center">
          <div className="flex items-center justify-center gap-xs text-outline mb-xs">
            <span className="material-symbols-outlined text-base">verified_user</span>
            <span className="text-label-caps uppercase tracking-wider text-xs">Secure Admin Session</span>
          </div>
        </footer>
      </main>

      {/* Google Material Icons */}
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    </div>
  );
}