'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

interface AdminLayoutClientProps {
  adminName: string;
  children: React.ReactNode;
}

export default function AdminLayoutClient({ adminName, children }: AdminLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleMenuClick = () => {
    // On desktop, toggle collapse mode; on mobile, toggle drawer open/close
    if (window.innerWidth >= 1024) {
      toggleCollapse();
    } else {
      setIsSidebarOpen((prev) => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative overflow-hidden h-screen">
      {/* Sidebar Container: hidden offscreen on mobile, slides in; static on large screens */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:translate-x-0 lg:relative lg:flex transition-transform duration-350 ease-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminSidebar
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleCollapse}
        />
      </div>

      {/* Mobile Backdrop Blur */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45 lg:hidden animate-fadeIn"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0 transition-all duration-300">
        <AdminHeader
          adminName={adminName}
          onMenuClick={handleMenuClick}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
