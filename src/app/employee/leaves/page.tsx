'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Loader2, Send, ShieldAlert, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function EmployeeLeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [type, setType] = useState('cuti');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employee/leaves');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat data cuti');
      setLeaves(data.leaves);
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/employee/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, startDate, endDate, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim pengajuan cuti');

      setSuccess('Pengajuan cuti/izin berhasil dikirim dan menunggu persetujuan.');
      setType('cuti');
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaves();
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" /> Disetujui
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" /> Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  const formatType = (type: string) => {
    switch (type) {
      case 'cuti':
        return 'Cuti Tahunan';
      case 'sakit':
        return 'Sakit (Izin Medis)';
      case 'izin':
        return 'Izin Penting';
      default:
        return type;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
          Pengajuan Cuti & Izin
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Ajukan cuti, sakit, atau izin dan pantau status persetujuan dari Owner.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 text-sm bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 text-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leave Request Form */}
        <div className="lg:col-span-1 bg-slate-900/20 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-500" />
            Formulir Pengajuan
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-2">Tipe Izin / Cuti</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500 text-sm transition"
              >
                <option value="cuti">Cuti Tahunan</option>
                <option value="sakit">Sakit (Izin Medis)</option>
                <option value="izin">Izin Lainnya</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-2">Mulai</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500 text-sm transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-2">Selesai</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500 text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-2">Alasan Pengajuan</label>
              <textarea
                required
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Berikan alasan detail pengajuan cuti/izin Anda..."
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500 text-sm transition resize-none placeholder-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" /> Kirim Pengajuan
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Table History Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
          <div className="p-6 border-b border-slate-800 bg-slate-950/20">
            <h2 className="text-base font-bold text-slate-200">Riwayat Pengajuan Cuti Anda</h2>
          </div>

          <div className="overflow-x-auto flex-1">
            {loading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                <p className="text-sm">Memuat riwayat cuti...</p>
              </div>
            ) : leaves.length === 0 ? (
              <div className="p-16 text-center text-slate-500 space-y-3">
                <Calendar className="w-12 h-12 mx-auto text-slate-700" />
                <p className="font-semibold text-slate-400">Belum ada riwayat pengajuan cuti</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Tipe</th>
                    <th className="px-6 py-4">Rentang Tanggal</th>
                    <th className="px-6 py-4">Alasan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Disetujui Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-900/10 transition">
                      <td className="px-6 py-4 font-semibold text-slate-200">
                        {formatType(leave.type)}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-medium text-slate-300">{formatDate(leave.startDate)}</div>
                        <div className="text-slate-500 text-[10px]">s.d.</div>
                        <div className="font-medium text-slate-300">{formatDate(leave.endDate)}</div>
                      </td>
                      <td className="px-6 py-4 text-xs max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(leave.status)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                        {leave.approvedBy || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
