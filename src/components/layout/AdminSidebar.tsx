'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  Briefcase,
  Users,
  CalendarCheck2,
  Coins,
  Wallet,
  FileSpreadsheet,
  FileCheck2,
  Receipt,
  UserCheck,
  X,
  Sun,
  Moon,
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface AdminSidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function AdminSidebar({ onClose, isCollapsed = false, onToggleCollapse }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
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

  const menuGroups = [
    {
      title: 'Menu Utama',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Data Master',
      items: [
        { name: 'Data Jabatan', path: '/admin/positions', icon: Briefcase },
        { name: 'Data Karyawan', path: '/admin/employees', icon: Users },
      ],
    },
    {
      title: 'Transaksi',
      items: [
        { name: 'Data Kehadiran', path: '/admin/transactions/attendance', icon: CalendarCheck2 },
        { name: 'Persetujuan Cuti', path: '/admin/transactions/leaves', icon: CalendarDays },
        { name: 'Persetujuan Lembur', path: '/admin/transactions/overtimes', icon: Clock },
        { name: 'Potongan Gaji', path: '/admin/transactions/deductions', icon: Coins },
        { name: 'Data Gaji', path: '/admin/transactions/salaries', icon: Wallet },
      ],
    },
    {
      title: 'Laporan',
      items: [
        { name: 'Laporan Gaji', path: '/admin/reports/salaries', icon: FileSpreadsheet },
        { name: 'Laporan Absensi', path: '/admin/reports/attendance', icon: FileCheck2 },
        { name: 'Slip Gaji', path: '/admin/reports/payslips', icon: Receipt },
      ],
    },
    {
      title: 'Pengaturan',
      items: [
        { name: 'Profil Saya', path: '/admin/profile', icon: UserCheck },
        { name: 'Manajemen Pengguna', path: '/admin/settings/users', icon: Users },
      ],
    },
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
          {/* Desktop Toggle Button (Expand/Collapse Width) */}
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

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-4 pt-6 pb-6 space-y-6 custom-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="space-y-2">
            {/* Section Title: Always visible on mobile, conditional on desktop */}
            <span className={`px-3 pt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 truncate ${
              isCollapsed ? 'block lg:hidden' : 'block'
            }`}>
              {group.title}
            </span>

            <div className="space-y-1">
              {group.items.map((item) => {
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
        ))}
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
