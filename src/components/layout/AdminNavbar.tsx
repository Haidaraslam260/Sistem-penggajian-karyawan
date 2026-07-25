'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Building2, LogOut, User, BarChart3, Users, DollarSign } from 'lucide-react';

interface AdminNavbarProps {
  adminName: string;
}

export default function AdminNavbar({ adminName }: AdminNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const isDarkMode = localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(isDarkMode);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: BarChart3 },
    { name: 'Monitor Absensi', path: '/admin/attendance', icon: Users },
    { name: 'Kelola Payroll', path: '/admin/payroll', icon: DollarSign },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img
                src={isDark ? "/logo-kerjaku-white.png" : "/logo-kerjaku.png"}
                alt="Kerjaku Logo"
                className="h-11 w-auto object-contain"
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 border-l border-slate-800 pl-3 mt-1 ml-1">
                Owner Portal
              </span>
            </div>

            {/* Navigation links */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-violet-600/20 text-violet-300 border-b-2 border-violet-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User info and Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-200">{adminName}</span>
              <span className="text-xs text-slate-500">Super Admin (Owner)</span>
            </div>
            
            <div className="w-9 h-9 rounded-full bg-slate-850 flex items-center justify-center text-emerald-450 border border-slate-750">
              <User className="w-4 h-4" />
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-405 hover:bg-red-500/10 transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile nav links */}
      <div className="md:hidden border-t border-slate-800/60 px-4 py-2 flex justify-around bg-slate-950/40">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive ? 'bg-violet-600/20 text-violet-300' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
