'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Loader2, Send, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

const formatIDR = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function EmployeeOvertimesPage() {
  const [overtimes, setOvertimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [reason, setReason] = useState('');

  const fetchOvertimes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employee/overtimes');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat data lembur');
      setOvertimes(data.overtimes);
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOvertimes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/employee/overtimes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, hours: parseFloat(hours), reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim klaim lembur');

      setSuccess('Klaim lembur berhasil dikirim dan menunggu verifikasi.');
      setDate('');
      setHours('');
      setReason('');
      fetchOvertimes();
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
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
          Klaim Lembur Harian
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Laporkan jam kerja lembur Anda dan pantau pencairan bonus uang lembur dari Owner.
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
        {/* Overtime Request Form */}
        <div className="lg:col-span-1 bg-slate-900/20 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-500" />
            Formulir Klaim Lembur
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-2">Tanggal Lembur</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500 text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-2">Durasi (Jam)</label>
              <input
                type="number"
                required
                min="0.5"
                max="8"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Contoh: 2 atau 3.5"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500 text-sm transition placeholder-slate-655"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-2">Tugas / Alasan Lembur</label>
              <textarea
                required
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Jelaskan pekerjaan atau projek yang dikerjakan selama jam lembur..."
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
                  <Send className="w-4 h-4" /> Kirim Klaim Lembur
                </>
              )}
            </button>
          </form>
        </div>

        {/* Overtime Request History */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-200">Riwayat Klaim Lembur</h2>
          </div>

          <div className="overflow-x-auto flex-1">
            {loading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                <p className="text-sm">Memuat data klaim lembur...</p>
              </div>
            ) : overtimes.length === 0 ? (
              <div className="p-16 text-center text-slate-500 space-y-3">
                <Calendar className="w-12 h-12 mx-auto text-slate-700" />
                <p className="font-semibold text-slate-400">Belum ada riwayat klaim lembur</p>
                <p className="text-xs max-w-sm mx-auto">Klaim lembur harian yang Anda laporkan akan terdaftar di sini.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-450 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Durasi</th>
                    <th className="px-6 py-4">Alasan</th>
                    <th className="px-6 py-4">Tarif/Jam</th>
                    <th className="px-6 py-4">Total Gaji Lembur</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Disetujui Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {overtimes.map((ot) => (
                    <tr key={ot.id} className="hover:bg-slate-900/10 transition">
                      <td className="px-6 py-4 font-semibold text-slate-200">
                        {formatDate(ot.date)}
                      </td>
                      <td className="px-6 py-4">
                        {ot.hours} Jam
                      </td>
                      <td className="px-6 py-4 text-xs max-w-xs truncate" title={ot.reason}>
                        {ot.reason}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-350">
                        {ot.ratePerHour > 0 ? formatIDR(ot.ratePerHour) : '-'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-200">
                        {ot.totalPay > 0 ? formatIDR(ot.totalPay) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(ot.status)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                        {ot.approvedBy || '-'}
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
