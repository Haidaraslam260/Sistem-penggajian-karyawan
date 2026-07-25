'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ShieldAlert, Printer, Calendar, FileSpreadsheet, Building2, ChevronDown } from 'lucide-react';
import { exportPayrollToExcel, exportBankTransferFile } from '@/lib/excelExport';

const formatIDR = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function AdminReportsSalariesPage() {
  const [period, setPeriod] = useState('');
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bankMenuOpen, setBankMenuOpen] = useState(false);

  useEffect(() => {
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setPeriod(currentPeriod);
  }, []);

  const fetchSalaries = async (targetPeriod: string) => {
    if (!targetPeriod) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/payroll?period=${targetPeriod}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat laporan gaji');
      setPayslips(data.payslips);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat laporan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries(period);
  }, [period]);

  const handlePrint = () => {
    window.print();
  };

  // Calculate totals
  const totals = payslips.reduce(
    (acc, curr) => {
      acc.basic += curr.basicSalary;
      acc.allowances += curr.totalAllowances;
      acc.deductions += curr.totalDeductions;
      acc.net += curr.netSalary;
      return acc;
    },
    { basic: 0, allowances: 0, deductions: 0, net: 0 }
  );

  return (
    <div className="space-y-8 animate-fadeIn printable-area">
      {/* Header (Hidden during browser prints using standard print css) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 no-print">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
            Laporan Rekapitulasi Gaji
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Laporan pengeluaran gaji bersih perusahaan berdasarkan periode.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
              <Calendar className="w-4 h-4" />
            </span>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
            />
          </div>

          {/* Tombol Export Excel (.xlsx) */}
          <button
            onClick={() => exportPayrollToExcel(payslips, period)}
            disabled={payslips.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-emerald-950/40 border border-emerald-500/30 transition text-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Rekap (.xlsx)
          </button>

          {/* Dropdown Tombol Transfer Bank */}
          <div className="relative">
            <button
              onClick={() => setBankMenuOpen(!bankMenuOpen)}
              disabled={payslips.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-950/40 border border-indigo-500/30 transition text-sm cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Export Transfer Bank</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {bankMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden py-1">
                <button
                  onClick={() => { exportBankTransferFile(payslips, period, 'standard'); setBankMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                  Format Standar (Lengkap)
                </button>
                <button
                  onClick={() => { exportBankTransferFile(payslips, period, 'bca'); setBankMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  Format BCA Payroll Batch
                </button>
                <button
                  onClick={() => { exportBankTransferFile(payslips, period, 'mandiri'); setBankMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  Format Mandiri MCM Batch
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition text-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Printable Title Block (only shown in print) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 text-black font-sans">
        <h2 className="text-2xl font-bold uppercase tracking-wider">PT. KERJAKU INDONESIA</h2>
        <p className="text-sm">Gedung Pusat Bisnis Lantai 12, Jakarta</p>
        <h3 className="text-lg font-semibold mt-3 uppercase border-t border-slate-400 pt-2">
          LAPORAN PENGELUARAN GAJI BULANAN - PERIODE {period}
        </h3>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 text-sm bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl flex items-center gap-2 animate-pulse no-print">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {!loading && payslips.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
          <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Gaji Pokok</p>
            <p className="text-lg font-mono font-bold text-slate-200 mt-1">{formatIDR(totals.basic)}</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Tunjangan</p>
            <p className="text-lg font-mono font-bold text-emerald-400 mt-1">{formatIDR(totals.allowances)}</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Potongan</p>
            <p className="text-lg font-mono font-bold text-rose-400 mt-1">{formatIDR(totals.deductions)}</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4.5 ring-2 ring-violet-500/20">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gaji Bersih Dibayarkan</p>
            <p className="text-lg font-mono font-bold text-violet-400 mt-1">{formatIDR(totals.net)}</p>
          </div>
        </div>
      )}

      {/* Report Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg print:border-collapse print:bg-white print:text-black">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center no-print">
          <div>
            <h2 className="text-lg font-bold text-slate-200">Rekapitulasi Pengeluaran Payroll</h2>
            <p className="text-xs text-slate-400">Periode Laporan: {period}</p>
          </div>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Download PDF</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-550 flex flex-col items-center gap-3 no-print">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm">Memuat laporan...</p>
            </div>
          ) : payslips.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-3 no-print">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-700" />
              <p className="font-semibold text-slate-400">Tidak ada data payroll pada periode ini</p>
              <p className="text-xs max-w-sm mx-auto">Silakan generate payroll pada menu Transaksi Gaji terlebih dahulu.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm print:text-xs">
              <thead className="bg-slate-950/20 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-850 print:bg-slate-100 print:text-black">
                <tr>
                  <th className="px-6 py-4">NIK</th>
                  <th className="px-6 py-4">Nama Karyawan</th>
                  <th className="px-6 py-4">Jabatan</th>
                  <th className="px-6 py-4">Gaji Pokok</th>
                  <th className="px-6 py-4">Tunjangan</th>
                  <th className="px-6 py-4">Potongan</th>
                  <th className="px-6 py-4 font-bold">Gaji Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300 print:text-black print:divide-slate-200">
                {payslips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-slate-900/10 transition duration-150">
                    <td className="px-6 py-4 font-mono">{slip.employee.nik}</td>
                    <td className="px-6 py-4 font-semibold">{slip.employee.name}</td>
                    <td className="px-6 py-4">{slip.employee.position.name}</td>
                    <td className="px-6 py-4 font-mono">{formatIDR(slip.basicSalary)}</td>
                    <td className="px-6 py-4 font-mono text-emerald-500 print:text-black">+{formatIDR(slip.totalAllowances)}</td>
                    <td className="px-6 py-4 font-mono text-rose-500 print:text-black">-{formatIDR(slip.totalDeductions)}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-100 print:text-black">{formatIDR(slip.netSalary)}</td>
                  </tr>
                ))}
                {/* Print/Table totals footer */}
                <tr className="bg-slate-950/40 font-bold border-t border-slate-800 print:bg-slate-50 print:text-black">
                  <td colSpan={3} className="px-6 py-4 text-right">TOTAL PENGELUARAN</td>
                  <td className="px-6 py-4 font-mono">{formatIDR(totals.basic)}</td>
                  <td className="px-6 py-4 font-mono text-emerald-500 print:text-black">+{formatIDR(totals.allowances)}</td>
                  <td className="px-6 py-4 font-mono text-rose-500 print:text-black">-{formatIDR(totals.deductions)}</td>
                  <td className="px-6 py-4 font-mono text-violet-400 print:text-black font-extrabold">{formatIDR(totals.net)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
