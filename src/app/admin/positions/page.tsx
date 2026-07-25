'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, X, Briefcase, Building, Coins, Loader2, ShieldAlert, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const formatIDR = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function AdminPositionsPage() {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);

  // Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [positionAllowance, setPositionAllowance] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPositions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/positions');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat jabatan');
      setPositions(data.positions);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data jabatan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  // Filter & Pagination Logic
  const filteredPositions = positions.filter((pos) => {
    return (
      searchQuery.trim() === '' ||
      pos.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pos.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredPositions.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPositions = filteredPositions.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const openAddModal = () => {
    setModalType('add');
    setName('');
    setDepartment('');
    setBasicSalary('');
    setPositionAllowance('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (pos: any) => {
    setModalType('edit');
    setEditingId(pos.id);
    setName(pos.name);
    setDepartment(pos.department);
    setBasicSalary(pos.basicSalary.toString());
    setPositionAllowance(pos.positionAllowance.toString());
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      id: editingId,
      name,
      department,
      basicSalary: parseFloat(basicSalary),
      positionAllowance: parseFloat(positionAllowance),
    };

    try {
      const endpoint = '/api/admin/positions';
      const method = modalType === 'add' ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data');

      setSuccess(modalType === 'add' ? 'Jabatan baru berhasil ditambahkan!' : 'Jabatan berhasil diperbarui!');
      setIsModalOpen(false);
      fetchPositions();

      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jabatan ini?')) return;
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/positions?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus jabatan');

      setSuccess('Jabatan berhasil dihapus!');
      fetchPositions();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
            Data Master Jabatan
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Kelola struktur jabatan, divisi, gaji pokok, serta tunjangan tetap jabatan.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-violet-600/20 active:scale-[0.98] transition-all duration-200 text-sm cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          Tambah Jabatan
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 text-sm bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl flex items-center gap-2 animate-pulse">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 text-sm bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-xl flex items-center gap-2">
          <span>{success}</span>
        </div>
      )}

      {/* List Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Table Header Controls */}
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/20">
          <div>
            <h2 className="text-lg font-bold text-slate-200">Daftar Jabatan Aktif</h2>
            <p className="text-xs text-slate-400 mt-0.5">Total {filteredPositions.length} jabatan ditemukan</p>
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
              placeholder="Cari Nama Jabatan / Divisi..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm">Memuat data jabatan...</p>
            </div>
          ) : filteredPositions.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-3">
              <Briefcase className="w-12 h-12 mx-auto text-slate-700" />
              <p className="font-semibold text-slate-400">Tidak ada data jabatan yang cocok</p>
              <p className="text-xs max-w-sm mx-auto">Coba ubah kata kunci pencarian Anda.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-350">
              <thead className="bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-405 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Nama Jabatan</th>
                  <th className="px-6 py-4">Divisi / Departemen</th>
                  <th className="px-6 py-4">Gaji Pokok</th>
                  <th className="px-6 py-4">Tunjangan Jabatan</th>
                  <th className="px-6 py-4">Total Gaji</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {paginatedPositions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-slate-900/30 transition duration-150">
                    <td className="px-6 py-4.5 font-semibold text-slate-205 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-violet-500" />
                      {pos.name}
                    </td>
                    <td className="px-6 py-4.5 text-slate-300">
                      {pos.department}
                    </td>
                    <td className="px-6 py-4.5 font-mono text-slate-300">
                      {formatIDR(pos.basicSalary)}
                    </td>
                    <td className="px-6 py-4.5 font-mono text-emerald-400">
                      {formatIDR(pos.positionAllowance)}
                    </td>
                    <td className="px-6 py-4.5 font-mono text-emerald-450 font-bold">
                      {formatIDR(pos.basicSalary + pos.positionAllowance)}
                    </td>
                    <td className="px-6 py-4.5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(pos)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all inline-flex items-center cursor-pointer"
                        title="Edit Jabatan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pos.id)}
                        className="p-2 rounded-lg bg-red-950/20 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/30 transition-all inline-flex items-center cursor-pointer"
                        title="Hapus Jabatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && filteredPositions.length > 0 && (
          <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 bg-slate-950/30">
            <div className="flex items-center gap-2">
              <span>Menampilkan</span>
              <span className="font-bold text-slate-200">
                {Math.min((safeCurrentPage - 1) * pageSize + 1, filteredPositions.length)}
              </span>
              <span>-</span>
              <span className="font-bold text-slate-200">
                {Math.min(safeCurrentPage * pageSize, filteredPositions.length)}
              </span>
              <span>dari</span>
              <span className="font-bold text-slate-200">{filteredPositions.length}</span>
              <span>jabatan</span>
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

      {/* Modal Add/Edit Portaled to Body */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="text-lg font-bold text-slate-200">
                {modalType === 'add' ? 'Tambah Jabatan Baru' : 'Perbarui Data Jabatan'}
              </h3>
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
                  Nama Jabatan
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Briefcase className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Senior Back-End Developer"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Divisi / Departemen
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Building className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Contoh: Engineering"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Gaji Pokok
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs font-bold">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(e.target.value)}
                      placeholder="8500000"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Tunjangan Jabatan
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs font-bold">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={positionAllowance}
                      onChange={(e) => setPositionAllowance(e.target.value)}
                      placeholder="1500000"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Show dynamic sum */}
              {basicSalary && positionAllowance && (
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                  <span className="text-slate-450 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-450" />
                    Total Gaji Pokok + Tunjangan
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {formatIDR(parseFloat(basicSalary) + parseFloat(positionAllowance))}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-2 flex items-center justify-center py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 text-sm cursor-pointer"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Simpan Data'
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
