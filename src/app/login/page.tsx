'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, Building2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan');
      }

      // Successful login - let middleware handle root redirection or push directly
      if (data.role === 'owner') {
        router.push('/admin/dashboard');
      } else {
        router.push('/employee/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden text-slate-100 font-sans">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/20 blur-[120px]" />

      <div className="relative w-full max-w-md p-8 mx-4 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl transition-all duration-300 hover:border-slate-700/80">
        
        {/* Branding header */}
        <div className="text-center mb-6">
          <div className="inline-flex mb-4">
            <img
              src="/logo-kerjaku.png"
              alt="Kerjaku Logo"
              className="h-16 w-auto object-contain dark:hidden"
            />
            <img
              src="/logo-kerjaku-white.png"
              alt="Kerjaku Logo"
              className="h-16 w-auto object-contain hidden dark:block"
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black tracking-widest text-slate-100 uppercase">
              LOGIN
            </h2>
            <p className="text-xs text-slate-400">
              Selamat datang, silakan login ke akun Anda
            </p>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-6 p-4 text-sm bg-red-950/40 border border-red-800/60 text-red-300 rounded-lg text-center font-medium animate-pulse">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 px-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              'Masuk ke Portal'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
          Powered by Next.js & Neon PostgreSQL
        </div>
      </div>
    </div>
  );
}
