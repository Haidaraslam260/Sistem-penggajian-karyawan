'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserCheck, Shield, Key, Loader2, ShieldAlert, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminSettingsUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);

  // Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/employees');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat pengguna');
      setUsers(data.employees);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter & Pagination Logic
  const filteredUsers = users.filter((u) => {
    return (
      searchQuery.trim() === '' ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setEmail(user.email);
    setRole(user.role);
    setPassword('');
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      id: selectedUser.id,
      nik: selectedUser.nik,
      name: selectedUser.name,
      email,
      password: password && password.trim() !== '' ? password : undefined,
      role,
      bankAccount: selectedUser.bankAccount,
      photo: selectedUser.photo,
      entryDate: selectedUser.entryDate,
      gender: selectedUser.gender,
      status: selectedUser.status,
      positionId: selectedUser.positionId,
    };

    try {
      const res = await fetch('/api/admin/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui pengguna');

      setSuccess(`Akun ${selectedUser.name} berhasil diperbarui!`);
      setIsModalOpen(false);
      fetchUsers();

      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
          Manajemen Pengguna & Hak Akses
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Kelola kredensial login, email, password, dan level otorisasi sistem (Owner vs Karyawan).
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 text-sm bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl flex items-center gap-2 animate-pulse">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 text-sm bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-xl">
          <span>{success}</span>
        </div>
      )}

      {/* Users Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Table Header Controls */}
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/20">
          <div>
            <h2 className="text-lg font-bold text-slate-200">Daftar Pengguna Sistem</h2>
            <p className="text-xs text-slate-400 mt-0.5">Total {filteredUsers.length} pengguna terdaftar</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Cari Nama / NIK / Email..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm">Memuat data pengguna...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-2">
              <Shield className="w-10 h-10 mx-auto text-slate-700" />
              <p className="font-semibold text-slate-400">Tidak ada pengguna yang cocok</p>
              <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian Anda.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-350">
              <thead className="bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-405 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Nama / NIK</th>
                  <th className="px-6 py-4">Username (Email)</th>
                  <th className="px-6 py-4">Hak Akses (Role)</th>
                  <th className="px-6 py-4">Rekening</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-900/30 transition duration-150">
                    <td className="px-6 py-4.5 font-medium text-slate-200">
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">NIK: {user.nik}</div>
                    </td>
                    <td className="px-6 py-4.5 font-mono text-slate-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${
                        user.role === 'owner'
                          ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                          : 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {user.role === 'owner' ? 'OWNER / ADMIN' : 'KARYAWAN'}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-slate-400">
                      {user.bankAccount}
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <button
                        onClick={() => openEditModal(user)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                      >
                        <Key className="w-3.5 h-3.5 text-slate-400" />
                        Edit Akses
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && filteredUsers.length > 0 && (
          <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 bg-slate-950/30">
            <div className="flex items-center gap-2">
              <span>Menampilkan</span>
              <span className="font-bold text-slate-200">
                {Math.min((safeCurrentPage - 1) * pageSize + 1, filteredUsers.length)}
              </span>
              <span>-</span>
              <span className="font-bold text-slate-200">
                {Math.min(safeCurrentPage * pageSize, filteredUsers.length)}
              </span>
              <span>dari</span>
              <span className="font-bold text-slate-200">{filteredUsers.length}</span>
              <span>pengguna</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Baris per halaman:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg font-mono text-slate-200 font-bold">
                  {safeCurrentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal Portaled to Body */}
      {mounted && isModalOpen && selectedUser && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <div>
                <h3 className="text-lg font-bold text-slate-200">Ubah Kredensial Pengguna</h3>
                <p className="text-xs text-violet-400 font-semibold mt-0.5">{selectedUser.name} ({selectedUser.nik})</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Email / Username
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@perusahaan.com"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Reset Password (Kosongkan jika tidak diubah)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Hak Akses (Role Otorisasi)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-205 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm cursor-pointer"
                  disabled={selectedUser.email === 'owner@perusahaan.com'}
                >
                  <option value="employee">KARYAWAN</option>
                  <option value="owner">OWNER / ADMIN</option>
                </select>
                {selectedUser.email === 'owner@perusahaan.com' && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    * Role Super Admin Utama tidak dapat diubah untuk keamanan sistem.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-2 flex items-center justify-center py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 text-sm cursor-pointer"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Simpan Otorisasi'
                )}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
