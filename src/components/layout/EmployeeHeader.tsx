'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Bell, Menu, User } from 'lucide-react';

interface EmployeeHeaderProps {
  employeeName: string;
  positionName: string;
  photo?: string;
  onMenuClick?: () => void;
}

export default function EmployeeHeader({ employeeName, positionName, photo, onMenuClick }: EmployeeHeaderProps) {
  const router = useRouter();
  const [currentPhoto, setCurrentPhoto] = React.useState(photo || '');
  const [displayName, setDisplayName] = React.useState(employeeName);

  const syncProfile = async () => {
    try {
      const res = await fetch('/api/employee/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.profile?.photo) {
          setCurrentPhoto(data.profile.photo);
        }
        if (data.profile?.name) {
          setDisplayName(data.profile.name);
        }
      }
    } catch (e) {
      console.error('Sync profile header error:', e);
    }
  };

  React.useEffect(() => {
    if (photo) setCurrentPhoto(photo);
    if (employeeName) setDisplayName(employeeName);
    syncProfile();

    window.addEventListener('profile-updated', syncProfile);
    return () => window.removeEventListener('profile-updated', syncProfile);
  }, [photo, employeeName]);

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

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40 px-6 sm:px-8 flex items-center justify-between no-print select-none">
      {/* Left Area: Mobile hamburger toggle & title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          title="Buka / Perkecil Sidebar"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>
        <h2 className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent uppercase">
          Portal Karyawan
        </h2>
      </div>

      {/* Right Area: Profile Details & notifications */}
      <div className="flex items-center gap-4">
        {/* Mock Notifications */}
        <button className="p-2 rounded-xl bg-slate-950/30 border border-slate-800 text-slate-450 hover:text-slate-200 hover:bg-slate-800/80 transition relative cursor-pointer">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full animate-ping" />
        </button>

        {/* Profile details - Clickable to Profile Settings */}
        <div className="flex items-center gap-3.5 pl-4.5 border-l border-slate-800">
          <button
            onClick={() => router.push('/employee/profile')}
            className="flex items-center gap-3.5 hover:opacity-90 transition cursor-pointer group text-left"
            title="Buka Pengaturan Profil & Kata Sandi"
          >
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-slate-100 tracking-wide leading-none group-hover:text-violet-400 transition">{displayName}</span>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-1">{positionName}</span>
            </div>

            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover border-2 border-slate-750 group-hover:border-violet-500 shadow-sm transition group-hover:scale-105"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-750 group-hover:border-violet-500 flex items-center justify-center text-violet-400 font-bold uppercase shadow-sm select-none transition group-hover:scale-105">
                <User className="w-4 h-4 text-violet-400" />
              </div>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-450 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-950/20 transition cursor-pointer"
            title="Keluar Portal"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
