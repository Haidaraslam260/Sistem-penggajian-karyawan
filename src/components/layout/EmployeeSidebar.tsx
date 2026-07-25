'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  MapPin,
  CalendarDays,
  Clock,
  Receipt,
  User,
  X,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface EmployeeSidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function EmployeeSidebar({ onClose, isCollapsed = false, onToggleCollapse }: EmployeeSidebarProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
    { name: 'Clock In / Out', path: '/employee/check-in', icon: MapPin },
    { name: 'Pengajuan Cuti', path: '/employee/leaves', icon: CalendarDays },
    { name: 'Klaim Lembur', path: '/employee/overtimes', icon: Clock },
    { name: 'Slip Gaji', path: '/employee/payslips', icon: Receipt },
    { name: 'Pengaturan Profil', path: '/employee/profile', icon: User },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-72 sm:w-80 lg:w-20' : 'w-72 sm:w-80 lg:w-64'
      } bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0 text-slate-300 transition-all duration-300 ease-in-out select-none`}
    >
      {/* Sidebar Header / Logo */}
      <div className={`h-16 border-b border-slate-800 flex items-center bg-slate-950/20 px-4 ${
        isCollapsed ? 'justify-between lg:justify-center' : 'justify-between'
      }`}>
        {/* Full Logo (Always visible on mobile; on desktop depends on isCollapsed) */}
        <div className={`flex items-center overflow-hidden ${isCollapsed ? 'flex lg:hidden' : 'flex'}`}>
          <img
            src={isDark ? "/logo-kerjaku-white.png" : "/logo-kerjaku.png"}
            alt="Kerjaku Logo"
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* Mini Badge Logo (Only on desktop when collapsed) */}
        {isCollapsed && (
          <div className="hidden lg:flex w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 items-center justify-center text-violet-400 font-bold">
            <Building2 className="w-5 h-5 text-violet-400" />
          </div>
        )}

        <div className="flex items-center gap-1">
          {/* Desktop Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title={isCollapsed ? "Perbesar Sidebar" : "Perkecil Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-violet-400" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {/* Close Button on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto px-4 pt-6 pb-6 space-y-6 custom-scrollbar">
        <div className="space-y-2">
          {/* Section Title: Always visible on mobile, conditional on desktop */}
          <span className={`px-3 pt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 truncate ${
            isCollapsed ? 'block lg:hidden' : 'block'
          }`}>
            Portal Karyawan
          </span>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={onClose}
                  title={isCollapsed ? item.name : undefined}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isCollapsed ? 'lg:justify-center lg:px-2.5' : ''
                  } ${
                    isActive
                      ? 'bg-violet-600/20 text-violet-300 border-l-2 border-violet-500 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {/* Item label text: Always visible on mobile, conditional on desktop */}
                  <span className={`truncate ${isCollapsed ? 'inline lg:hidden' : 'inline'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer Dark Mode Toggle */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/20">
        {/* Full switch: Always visible on mobile, visible on desktop if not collapsed */}
        <div className={`items-center justify-between px-3 py-2 bg-slate-950/30 border border-slate-800/60 rounded-xl ${
          isCollapsed ? 'flex lg:hidden' : 'flex'
        }`}>
          <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-2">
            {isDark ? <Moon className="w-4 h-4 text-violet-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            {isDark ? 'Mode Gelap' : 'Mode Terang'}
          </span>

          <button
            onClick={toggleDarkMode}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none flex items-center relative cursor-pointer ${
              isDark ? 'bg-violet-600' : 'bg-slate-700'
            }`}
            aria-label="Toggle Dark Mode"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                isDark ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Compact switch: Only on desktop when collapsed */}
        {isCollapsed && (
          <button
            onClick={toggleDarkMode}
            className="hidden lg:flex w-full py-2.5 justify-center items-center rounded-xl bg-slate-950/40 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
          >
            {isDark ? <Moon className="w-5 h-5 text-violet-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
          </button>
        )}
      </div>
    </aside>
  );
}
