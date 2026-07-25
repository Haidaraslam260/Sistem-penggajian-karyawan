'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, Loader2, FileText, CheckCircle2, X, Printer, Coins, ShieldAlert, FileSpreadsheet, Building2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportPayrollToExcel, exportBankTransferFile } from '@/lib/excelExport';

const formatIDR = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function AdminTransactionsSalariesPage() {
  const [period, setPeriod] = useState('');
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detailed Payslip Modal State
  const [activePayslip, setActivePayslip] = useState<any | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUpdateStatus = async (payslipId: string, newStatus: 'paid' | 'pending') => {
    setUpdatingStatus(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/payroll', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payslipId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status pembayaran');

      // Update list state
      setPayslips((prev) =>
        prev.map((slip) => (slip.id === payslipId ? { ...slip, paymentStatus: newStatus } : slip))
      );

      // Update modal state
      setActivePayslip((prev: any) => {
        if (prev && prev.id === payslipId) {
          return { ...prev, paymentStatus: newStatus };
        }
        return prev;
      });

      setSuccessMsg(`Berhasil menandai slip gaji sebagai ${newStatus === 'paid' ? 'Telah Dibayar' : 'Belum Dibayar'}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memperbarui status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setPeriod(currentPeriod);
  }, []);

  const fetchPayslips = async (targetPeriod: string) => {
    if (!targetPeriod) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/payroll?period=${targetPeriod}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengambil data payroll');
      setPayslips(data.payslips);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat slip gaji.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips(period);
  }, [period]);

  // Filter & Pagination Logic
  const departments = Array.from(new Set(payslips.map(p => p.employee?.position?.department).filter(Boolean)));

  const filteredPayslips = payslips.filter((p) => {
    const matchesSearch = searchQuery.trim() === '' ||
      p.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.employee.nik.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === '' || p.employee.position?.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPayslips.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPayslips = filteredPayslips.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses payroll');
      
      setSuccessMsg(`Berhasil menghasilkan ${data.count} slip gaji untuk periode ${period}!`);
      fetchPayslips(period);
      
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses payroll.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
            Transaksi Penggajian Karyawan
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Generate payroll bulanan, verifikasi tunjangan, dan hitung gaji bersih karyawan.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
          />

          <button
            onClick={handleGenerate}
            disabled={generating || !period}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-violet-950/40 border border-violet-500/30 transition text-sm cursor-pointer"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wallet className="w-4 h-4" />
            )}
            Generate Gaji Bulanan
          </button>

          <button
            onClick={() => exportPayrollToExcel(payslips, period)}
            disabled={payslips.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-emerald-950/40 border border-emerald-500/30 transition text-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Rekap (.xlsx)
          </button>

          <button
            onClick={() => exportBankTransferFile(payslips, period, 'standard')}
            disabled={payslips.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-950/40 border border-indigo-500/30 transition text-sm cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            Export Bank Transfer
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 text-sm bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl flex items-center gap-2 animate-pulse">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 text-sm bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {/* Payroll Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Table Header Controls */}
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/20">
          <div>
            <h2 className="text-lg font-bold text-slate-200">Rekapitulasi Gaji Karyawan</h2>
            <p className="text-xs text-slate-400 mt-0.5">Total {filteredPayslips.length} slip gaji ditemukan</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 md:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Cari Nama / NIK..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            {/* Department Filter */}
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
              >
                <option value="">Semua Divisi</option>
                {departments.map((dept: any) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm">Memuat data gaji...</p>
            </div>
          ) : filteredPayslips.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-3">
              <Coins className="w-12 h-12 mx-auto text-slate-700" />
              <p className="font-semibold text-slate-400">Tidak ada data gaji yang cocok</p>
              <p className="text-xs max-w-sm mx-auto">Silakan ubah kata kunci pencarian atau filter divisi yang dipilih.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-350">
              <thead className="bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-405 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Karyawan (NIK)</th>
                  <th className="px-6 py-4">Gaji Pokok</th>
                  <th className="px-6 py-4">Total Tunjangan</th>
                  <th className="px-6 py-4">Total Potongan</th>
                  <th className="px-6 py-4">Gaji Bersih</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {paginatedPayslips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-slate-900/30 transition duration-150">
                    <td className="px-6 py-4.5 font-medium text-slate-200">
                      <div className="font-semibold text-slate-205">{slip.employee.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">NIK: {slip.employee.nik} ({slip.employee.position.name})</div>
                    </td>
                    <td className="px-6 py-4.5 font-mono text-slate-300">
                      {formatIDR(slip.basicSalary)}
                    </td>
                    <td className="px-6 py-4.5 font-mono text-emerald-400">
                      +{formatIDR(slip.totalAllowances)}
                    </td>
                    <td className="px-6 py-4.5 font-mono text-rose-450">
                      -{formatIDR(slip.totalDeductions)}
                    </td>
                    <td className="px-6 py-4.5 font-mono text-emerald-450 font-bold">
                      {formatIDR(slip.netSalary)}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${
                        slip.paymentStatus === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {slip.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <button
                        onClick={() => setActivePayslip(slip)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-600/10 hover:bg-violet-600 text-violet-300 hover:text-white rounded-lg text-xs font-semibold border border-violet-500/20 transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Rincian Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && filteredPayslips.length > 0 && (
          <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 bg-slate-950/30">
            <div className="flex items-center gap-2">
              <span>Menampilkan</span>
              <span className="font-bold text-slate-200">
                {Math.min((safeCurrentPage - 1) * pageSize + 1, filteredPayslips.length)}
              </span>
              <span>-</span>
              <span className="font-bold text-slate-200">
                {Math.min(safeCurrentPage * pageSize, filteredPayslips.length)}
              </span>
              <span>dari</span>
              <span className="font-bold text-slate-200">{filteredPayslips.length}</span>
              <span>slip gaji</span>
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

      {/* Executive Printable Slip Gaji Modal (Portaled to document.body) */}
      {activePayslip && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[88vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white print:text-black">
            
            {/* Top Accent Gradient Line */}
            <div className="h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-500 w-full shrink-0 no-print" />

            {/* Modal Header (Hidden in Print) */}
            <div className="px-8 py-5 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center no-print shrink-0">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 tracking-wide uppercase">
                <FileText className="w-4 h-4 text-emerald-400" />
                Slip Gaji Resmi Karyawan
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border border-slate-700/60"
                  title="Cetak / Simpan PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cetak PDF</span>
                </button>
                <button
                  onClick={() => setActivePayslip(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all cursor-pointer border border-slate-700/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Executive Printable Payslip Body */}
            <div id="payslip-modal-content" className="p-8 sm:p-10 space-y-8 text-slate-300 bg-slate-900 overflow-y-auto custom-scrollbar flex-1 print:p-0 print:bg-white print:text-black font-sans">
              
              {/* Kop Perusahaan Header (Formal Double Border in Print) */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b-2 border-slate-800 print:border-b-2 print:border-black gap-4 print:pt-4 print:pb-4">
                <div>
                  <h4 className="text-2xl font-black tracking-tight bg-gradient-to-r from-violet-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent print:text-black print:text-2xl print:leading-normal uppercase">
                    PT. KERJAKU INDONESIA
                  </h4>
                  <p className="text-xs text-slate-450 mt-1 print:text-slate-800 print:font-medium">
                    Gedung Pusat Bisnis Lantai 12, Jakarta • Telp: (021) 555-0199
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-1">
                  <span className="inline-block px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-300 print:bg-white print:text-black print:border-black print:px-2 print:py-0.5">
                    PERIODE: {activePayslip.period}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 print:text-slate-700">
                    NO. SLIP: #SLIP-{activePayslip.period.replace('-', '')}-{activePayslip.employee.nik}
                  </span>
                </div>
              </div>

              {/* Employee Information Card / Table */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs print:bg-slate-50 print:border print:border-slate-300 print:rounded-none print:p-4 print:text-black">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 print:text-slate-700 font-bold uppercase tracking-wider">Nama Karyawan</p>
                  <p className="text-slate-100 font-semibold print:text-black print:font-bold">{activePayslip.employee.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 print:text-slate-700 font-bold uppercase tracking-wider">NIK / Divisi</p>
                  <p className="text-slate-200 font-medium print:text-black">{activePayslip.employee.nik} ({activePayslip.employee.position.department})</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 print:text-slate-700 font-bold uppercase tracking-wider">Jabatan</p>
                  <p className="text-slate-200 font-medium print:text-black">{activePayslip.employee.position.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 print:text-slate-700 font-bold uppercase tracking-wider">Rekening Bank</p>
                  <p className="text-slate-300 font-mono print:text-black">{activePayslip.employee.bankAccount}</p>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown Tables (Side-by-Side) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 print:grid-cols-2 print:gap-6">
                
                {/* Earnings Card / Column */}
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-6 flex flex-col justify-between print:border print:border-slate-300 print:rounded-none print:p-4 print:bg-white">
                  <div>
                    <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-3 mb-4 print:border-black print:pb-2 print:mb-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 print:hidden" />
                      <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-black print:font-bold">
                        PENGHASILAN (EARNINGS)
                      </h5>
                    </div>
                    <div className="space-y-3 text-xs print:space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-800/40 pb-2.5 print:border-slate-200 print:pb-1.5">
                        <span className="text-slate-400 print:text-slate-800">Gaji Pokok</span>
                        <span className="font-mono text-slate-200 print:text-black print:font-semibold">{formatIDR(activePayslip.basicSalary)}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-800/40 pb-2.5 print:border-slate-200 print:pb-1.5">
                        <span className="text-slate-400 print:text-slate-800">Tunjangan Jabatan</span>
                        <span className="font-mono text-slate-200 print:text-black print:font-semibold">{formatIDR(activePayslip.totalAllowances)}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-800/40 pb-2.5 print:border-slate-200 print:pb-1.5">
                        <span className="text-slate-400 print:text-slate-800">Uang Lembur</span>
                        <span className="font-mono text-slate-200 print:text-black print:font-semibold">{formatIDR(activePayslip.overtimePay || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 mt-6 border-t-2 border-emerald-500/30 text-xs font-bold text-emerald-400 print:border-t-2 print:border-black print:pt-2 print:mt-4 print:text-black">
                    <span>TOTAL PENGHASILAN (A)</span>
                    <span className="font-mono text-base print:text-sm print:font-bold">{formatIDR(activePayslip.basicSalary + activePayslip.totalAllowances + (activePayslip.overtimePay || 0))}</span>
                  </div>
                </div>

                {/* Deductions Card / Column */}
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-6 flex flex-col justify-between print:border print:border-slate-300 print:rounded-none print:p-4 print:bg-white">
                  <div>
                    <div className="flex items-center gap-2 border-b border-rose-500/20 pb-3 mb-4 print:border-black print:pb-2 print:mb-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 print:hidden" />
                      <h5 className="text-xs font-bold uppercase tracking-wider text-rose-400 print:text-black print:font-bold">
                        POTONGAN (DEDUCTIONS)
                      </h5>
                    </div>
                    <div className="space-y-3 text-xs print:space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-800/40 pb-2.5 print:border-slate-200 print:pb-1.5">
                        <span className="text-slate-400 print:text-slate-800">BPJS Ketenagakerjaan (2% JHT + 1% JP)</span>
                        <span className="font-mono text-slate-200 print:text-black print:font-semibold">{formatIDR(activePayslip.bpjsKetenagakerjaan || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-800/40 pb-2.5 print:border-slate-200 print:pb-1.5">
                        <span className="text-slate-400 print:text-slate-800">BPJS Kesehatan (1%)</span>
                        <span className="font-mono text-slate-200 print:text-black print:font-semibold">{formatIDR(activePayslip.bpjsKesehatan || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-800/40 pb-2.5 print:border-slate-200 print:pb-1.5">
                        <span className="text-slate-400 print:text-slate-800">PPh 21 TER ({activePayslip.employee?.ptkpStatus || 'TK/0'})</span>
                        <span className="font-mono text-slate-200 print:text-black print:font-semibold">{formatIDR(activePayslip.pph21 || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-800/40 pb-2.5 print:border-slate-200 print:pb-1.5">
                        <span className="text-slate-400 print:text-slate-800">Potongan Kehadiran (Terlambat/Alpa)</span>
                        <span className="font-mono text-slate-200 print:text-black print:font-semibold">
                          {formatIDR(Math.max(0, (activePayslip.totalDeductions || 0) - (activePayslip.bpjsKetenagakerjaan || 0) - (activePayslip.bpjsKesehatan || 0) - (activePayslip.pph21 || 0)))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 mt-6 border-t-2 border-rose-500/30 text-xs font-bold text-rose-400 print:border-t-2 print:border-black print:pt-2 print:mt-4 print:text-black">
                    <span>TOTAL POTONGAN (B)</span>
                    <span className="font-mono text-base print:text-sm print:font-bold">{formatIDR(activePayslip.totalDeductions)}</span>
                  </div>
                </div>

              </div>

              {/* Take Home Pay Highlight Card */}
              <div className="bg-emerald-950 border-2 border-emerald-500/60 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl shadow-emerald-950/40 print:bg-emerald-50 print:border-2 print:border-emerald-700 print:text-black print:p-4">
                <div>
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 print:text-emerald-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse no-print" />
                    GAJI BERSIH DITERIMA (TAKE HOME PAY)
                  </h5>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-300 font-mono tracking-tight print:text-emerald-950 print:text-2xl">
                  {formatIDR(activePayslip.netSalary)}
                </div>
              </div>

              {/* Formal Company Signature Block (Printed Payslip Standard) */}
              <div className="hidden print:grid grid-cols-2 gap-8 text-center text-xs text-black pt-8 border-t border-slate-300">
                <div className="space-y-16">
                  <p className="font-bold uppercase tracking-wider">Penerima / Karyawan</p>
                  <div>
                    <p className="font-bold underline uppercase">{activePayslip.employee.name}</p>
                    <p className="text-[10px] text-slate-600">NIK: {activePayslip.employee.nik}</p>
                  </div>
                </div>
                <div className="space-y-16">
                  <div>
                    <p className="text-[11px]">Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="font-bold uppercase tracking-wider mt-0.5">Manager HRD & Payroll</p>
                  </div>
                  <div>
                    <p className="font-bold underline uppercase">PT. KERJAKU INDONESIA</p>
                    <p className="text-[10px] text-slate-600">Dokumen Sah Komputerisasi</p>
                  </div>
                </div>
              </div>

              {/* Official Electronic Verification Stamp Footer */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 print:border-t print:border-slate-300 print:text-slate-600 gap-2 print:pt-2">
                <div>
                  ✓ Dokumen ini diterbitkan secara otomatis dan sah oleh Portal HR PT. KERJAKU INDONESIA.
                </div>
                <div>
                  Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}
                </div>
              </div>
            </div>

            {/* Non-printable Action Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center no-print shrink-0">
              <div>
                {updatingStatus ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                    <span>Memproses status...</span>
                  </div>
                ) : activePayslip.paymentStatus === 'paid' ? (
                  <button
                    onClick={() => handleUpdateStatus(activePayslip.id, 'pending')}
                    disabled={updatingStatus}
                    className="px-3.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold shadow-md active:scale-95 transition cursor-pointer"
                  >
                    Tandai Belum Dibayar (Pending)
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(activePayslip.id, 'paid')}
                    disabled={updatingStatus}
                    className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold shadow-md active:scale-95 transition cursor-pointer"
                  >
                    Tandai Telah Dibayar (Paid)
                  </button>
                )}
              </div>
              <button
                onClick={() => setActivePayslip(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition active:scale-95 border border-slate-700/60"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
