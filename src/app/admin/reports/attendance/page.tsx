'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ShieldAlert, Printer, Calendar, FileSpreadsheet, FileCheck2 } from 'lucide-react';

export default function AdminReportsAttendancePage() {
  const [period, setPeriod] = useState('');
  const [reportList, setReportList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setPeriod(currentPeriod);
  }, []);

  const fetchReport = async (targetPeriod: string) => {
    if (!targetPeriod) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/reports/attendance?period=${targetPeriod}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat laporan absensi');
      setReportList(data.report);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat laporan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(period);
  }, [period]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn printable-area">
      {/* Header (Hidden during prints) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
            Laporan Absensi Karyawan
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Persentase kehadiran dan total kumulatif status presensi bulanan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
              <Calendar className="w-4 h-4" />
            </span>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-205 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-705 text-slate-205 font-semibold rounded-xl border border-slate-700 transition"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Printable Letterhead */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 text-black font-sans">
        <h2 className="text-2xl font-bold uppercase tracking-wider">PT. KERJAKU INDONESIA</h2>
        <p className="text-sm">Gedung Pusat Bisnis Lantai 12, Jakarta</p>
        <h3 className="text-lg font-semibold mt-3 uppercase border-t border-slate-400 pt-2">
          LAPORAN ABSENSI BULANAN KARYAWAN - PERIODE {period}
        </h3>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 text-sm bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl flex items-center gap-2 animate-pulse no-print">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          {error}
        </div>
      )}

      {/* List Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg print:border-collapse print:bg-white print:text-black">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center no-print">
          <div>
            <h2 className="text-lg font-bold text-slate-200">Rekapitulasi Kehadiran Karyawan</h2>
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
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3 no-print">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm">Memuat rekap absensi...</p>
            </div>
          ) : reportList.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-3 no-print">
              <FileCheck2 className="w-12 h-12 mx-auto text-slate-700" />
              <p className="font-semibold text-slate-400">Tidak ada data absensi pada periode ini</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm print:text-xs">
              <thead className="bg-slate-950/20 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-850 print:bg-slate-100 print:text-black">
                <tr>
                  <th className="px-6 py-4">NIK</th>
                  <th className="px-6 py-4">Nama Karyawan</th>
                  <th className="px-6 py-4">Hadir</th>
                  <th className="px-6 py-4">Terlambat</th>
                  <th className="px-6 py-4">Sakit</th>
                  <th className="px-6 py-4">Cuti</th>
                  <th className="px-6 py-4">Alpa</th>
                  <th className="px-6 py-4 font-bold">Rasio Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300 print:text-black print:divide-slate-200">
                {reportList.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-900/10 transition duration-150">
                    <td className="px-6 py-4.5 font-mono">{row.nik}</td>
                    <td className="px-6 py-4.5 font-semibold">
                      <div>{row.name}</div>
                      <div className="text-xs text-slate-500 font-normal no-print">{row.position.name}</div>
                    </td>
                    <td className="px-6 py-4.5 font-mono text-emerald-450 print:text-black">{row.counts.hadir} hari</td>
                    <td className="px-6 py-4.5 font-mono text-amber-500 print:text-black">{row.counts.terlambat} hari</td>
                    <td className="px-6 py-4.5 font-mono text-sky-400 print:text-black">{row.counts.sakit} hari</td>
                    <td className="px-6 py-4.5 font-mono text-violet-400 print:text-black">{row.counts.cuti} hari</td>
                    <td className="px-6 py-4.5 font-mono text-rose-500 print:text-black">{row.counts.alpa} hari</td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        {/* Dynamic Rate Badge */}
                        <span className={`font-bold font-mono text-xs ${
                          row.rate >= 90 ? 'text-emerald-450' :
                          row.rate >= 75 ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          {row.rate}%
                        </span>

                        {/* Progress Bar (Hidden during prints) */}
                        <div className="w-24 bg-slate-850 h-2 rounded-full overflow-hidden no-print">
                          <div
                            className={`h-full rounded-full ${
                              row.rate >= 90 ? 'bg-emerald-500' :
                              row.rate >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${row.rate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
