'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Coins, Loader2, Edit2, ShieldAlert, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const formatIDR = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function AdminTransactionsDeductionsPage() {
  const [period, setPeriod] = useState('');
  const [deductionsList, setDeductionsList] = useState<any[]>([]);
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
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);

  // Form Fields
  const [lateDeduction, setLateDeduction] = useState('');
  const [absentDeduction, setAbsentDeduction] = useState('');
  const [otherDeduction, setOtherDeduction] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setPeriod(currentPeriod);
  }, []);

  const fetchDeductions = async (targetPeriod: string) => {
    if (!targetPeriod) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/deductions?period=${targetPeriod}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat potongan');
      setDeductionsList(data.deductions);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data potongan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeductions(period);
  }, [period]);

  // Filter & Pagination Logic
  const filteredDeductions = deductionsList.filter((emp) => {
    return (
      searchQuery.trim() === '' ||
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredDeductions.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedDeductions = filteredDeductions.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const openEditModal = (emp: any) => {
    setSelectedEmp(emp);
    setLateDeduction(emp.deduction?.lateDeduction?.toString() || '0');
    setAbsentDeduction(emp.deduction?.absentDeduction?.toString() || '0');
    setOtherDeduction(emp.deduction?.otherDeduction?.toString() || '0');
    setDescription(emp.deduction?.description || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      employeeId: selectedEmp.id,
      period,
      lateDeduction: parseFloat(lateDeduction || '0'),
      absentDeduction: parseFloat(absentDeduction || '0'),
      otherDeduction: parseFloat(otherDeduction || '0'),
      description,
    };

    try {
      const res = await fetch('/api/admin/deductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan potongan');

      setSuccess(`Potongan untuk ${selectedEmp.name} berhasil disimpan!`);
      setIsModalOpen(false);
      fetchDeductions(period);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
            Potongan Gaji Bulanan
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Sesuaikan denda keterlambatan, denda absen, atau potongan manual per karyawan.
          </p>
        </div>

        {/* Period Selector */}
        <input
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
        />
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

      {/* Deductions Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Table Header Controls */}
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/20">
          <div>
            <h2 className="text-lg font-bold text-slate-200">Daftar Potongan Periode {period}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Total {filteredDeductions.length} karyawan ditemukan</p>
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
              placeholder="Cari Karyawan / NIK..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm">Memuat data potongan...</p>
            </div>
          ) : filteredDeductions.length === 0 ? (
            <div className="p-12 text-center text-slate-550">
              Tidak ada data karyawan yang cocok.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-355 table-auto">
              <thead className="bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-405 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Karyawan (NIK)</th>
                  <th className="px-4 py-3">Jabatan</th>
                  <th className="px-4 py-3">Potongan Telat</th>
                  <th className="px-4 py-3">Potongan Alpa</th>
                  <th className="px-4 py-3">Potongan Lain</th>
                  <th className="px-4 py-3">Total Potongan</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {paginatedDeductions.map((emp) => {
                  const d = emp.deduction;
                  const total = (d?.lateDeduction || 0) + (d?.absentDeduction || 0) + (d?.otherDeduction || 0);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-900/30 transition duration-150">
                      <td className="px-4 py-3 text-xs">
                        <div className="font-semibold text-slate-200">{emp.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">NIK: {emp.nik}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">
                        {emp.position.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-rose-400 text-xs">
                        {d?.lateDeduction ? formatIDR(d.lateDeduction) : '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-rose-400 text-xs">
                        {d?.absentDeduction ? formatIDR(d.absentDeduction) : '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-rose-455 text-xs">
                        {d?.otherDeduction ? formatIDR(d.otherDeduction) : '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-rose-500 font-bold text-xs">
                        {total > 0 ? formatIDR(total) : formatIDR(0)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-[120px] truncate" title={d?.description || ''}>
                        {d?.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-violet-600/10 hover:bg-violet-650 text-violet-300 hover:text-white rounded-lg text-xs font-semibold border border-violet-500/20 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Sesuaikan</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && filteredDeductions.length > 0 && (
          <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 bg-slate-950/30">
            <div className="flex items-center gap-2">
              <span>Menampilkan</span>
              <span className="font-bold text-slate-200">
                {Math.min((safeCurrentPage - 1) * pageSize + 1, filteredDeductions.length)}
              </span>
              <span>-</span>
              <span className="font-bold text-slate-200">
                {Math.min(safeCurrentPage * pageSize, filteredDeductions.length)}
              </span>
              <span>dari</span>
              <span className="font-bold text-slate-200">{filteredDeductions.length}</span>
              <span>karyawan</span>
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

      {/* Adjust Deductions Modal Portaled to Body */}
      {mounted && isModalOpen && selectedEmp && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-200">Atur Potongan Gaji</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{selectedEmp.name} (NIK: {selectedEmp.nik})</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="px-5 py-4 space-y-4">
              {/* Row 1: Denda Telat & Denda Mangkir */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-450 mb-1">
                    Denda Telat
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 text-[10px] font-bold">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={lateDeduction}
                      onChange={(e) => setLateDeduction(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-2.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-450 mb-1">
                    Denda Alpa
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 text-[10px] font-bold">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={absentDeduction}
                      onChange={(e) => setAbsentDeduction(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-2.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Potongan Lain & Keterangan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-450 mb-1">
                    Potongan Lain
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 text-[10px] font-bold">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={otherDeduction}
                      onChange={(e) => setOtherDeduction(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-2.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-450 mb-1">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Misal: Denda inventaris"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-xs"
                  />
                </div>
              </div>

              {/* Show sum */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-450 uppercase flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-rose-500" />
                  Total Akumulasi Denda
                </span>
                <span className="font-mono text-rose-400 font-bold">
                  {formatIDR(
                    parseFloat(lateDeduction || '0') +
                    parseFloat(absentDeduction || '0') +
                    parseFloat(otherDeduction || '0')
                  )}
                </span>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-2 flex items-center justify-center py-2.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 text-xs cursor-pointer"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Simpan Potongan'
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
