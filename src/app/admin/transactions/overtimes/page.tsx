'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, DollarSign, Loader2, Check, X, ShieldAlert, CheckCircle, XCircle, Search } from 'lucide-react';

const formatIDR = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function AdminOvertimesPage() {
  const [overtimes, setOvertimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rates, setRates] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOvertimes = async () => {
    setLoading(true);
    setError('');
    try {
      const url = statusFilter === 'all' 
        ? '/api/admin/overtimes' 
        : `/api/admin/overtimes?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat data lembur');
      setOvertimes(data.overtimes);

      // Initialize default rates (e.g. 50000) for pending items
      const initialRates: { [key: string]: string } = {};
      data.overtimes.forEach((ot: any) => {
        if (ot.status === 'pending') {
          initialRates[ot.id] = '50000';
        }
      });
      setRates((prev) => ({ ...prev, ...initialRates }));
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOvertimes();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setActionId(id);
    setError('');
    setSuccess('');
    const rate = status === 'approved' ? parseFloat(rates[id] || '0') : 0;

    if (status === 'approved' && (isNaN(rate) || rate <= 0)) {
      setError('Tarif lembur per jam harus berupa angka positif.');
      setActionId(null);
      return;
    }

    try {
      const res = await fetch('/api/admin/overtimes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, ratePerHour: rate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses klaim lembur');

      setSuccess(`Klaim lembur berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}.`);
      fetchOvertimes();
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah status klaim lembur.');
    } finally {
      setActionId(null);
    }
  };

  const handleRateChange = (id: string, val: string) => {
    setRates({ ...rates, [id]: val });
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredOvertimes = overtimes.filter(ot => 
    ot.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ot.employee.nik.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
          Persetujuan Klaim Lembur
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Tinjau klaim jam lembur karyawan dan tentukan nominal tarif per jam sebelum menyetujui pencairan tunjangan lembur.
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

      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/20 border border-slate-800 p-4 rounded-2xl shadow-md">
        <div className="flex items-center gap-2 w-full md:w-96 bg-slate-950/60 border border-slate-850 px-3.5 py-2.5 rounded-xl">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari karyawan berdasarkan nama atau NIK..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-slate-200 w-full placeholder-slate-600"
          />
        </div>

        <div className="flex gap-1.5 self-stretch md:self-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { label: 'Menunggu (Pending)', value: 'pending' },
            { label: 'Disetujui', value: 'approved' },
            { label: 'Ditolak', value: 'rejected' },
            { label: 'Semua', value: 'all' },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setStatusFilter(btn.value)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === btn.value
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-slate-850'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* List Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
          <h2 className="text-lg font-bold text-slate-200">Daftar Pengajuan Lembur Karyawan</h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm">Memuat data pengajuan lembur...</p>
            </div>
          ) : filteredOvertimes.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-3">
              <Clock className="w-12 h-12 mx-auto text-slate-700" />
              <p className="font-semibold text-slate-400">Tidak ada pengajuan lembur pada status ini</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Karyawan</th>
                  <th className="px-6 py-4">Departemen / Jabatan</th>
                  <th className="px-6 py-4">Tanggal Lembur</th>
                  <th className="px-6 py-4">Durasi Kerja</th>
                  <th className="px-6 py-4">Alasan</th>
                  <th className="px-6 py-4">Tarif/Jam</th>
                  <th className="px-6 py-4">Total Gaji Lembur</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredOvertimes.map((ot) => (
                  <tr key={ot.id} className="hover:bg-slate-900/10 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{ot.employee.name}</div>
                      <div className="text-[11px] text-slate-500">NIK: {ot.employee.nik}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300 font-medium">{ot.employee.position.name}</div>
                      <div className="text-[11px] text-slate-500">{ot.employee.position.department}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {formatDate(ot.date)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-300">
                      {ot.hours} Jam
                    </td>
                    <td className="px-6 py-4 text-xs max-w-xs truncate" title={ot.reason}>
                      {ot.reason}
                    </td>
                    <td className="px-6 py-4">
                      {ot.status === 'pending' ? (
                        <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1 w-28">
                          <span className="text-xs text-slate-500 font-semibold">Rp</span>
                          <input
                            type="number"
                            value={rates[ot.id] || ''}
                            onChange={(e) => handleRateChange(ot.id, e.target.value)}
                            className="bg-transparent border-none outline-none text-xs text-slate-200 w-full font-bold"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-350 font-medium">
                          {ot.ratePerHour > 0 ? formatIDR(ot.ratePerHour) : '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-100">
                      {ot.status === 'pending' ? (
                        <span className="text-xs text-slate-500 italic">Kalkulasi setelah disetujui</span>
                      ) : ot.totalPay > 0 ? (
                        formatIDR(ot.totalPay)
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ot.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {ot.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(ot.id, 'approved')}
                            disabled={actionId !== null}
                            className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 transition cursor-pointer"
                            title="Setujui Lembur"
                          >
                            {actionId === ot.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(ot.id, 'rejected')}
                            disabled={actionId !== null}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 transition cursor-pointer"
                            title="Tolak Lembur"
                          >
                            {actionId === ot.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">
                          {ot.status === 'approved' ? `Oleh: ${ot.approvedBy || 'Owner'}` : 'Telah Ditolak'}
                        </span>
                      )}
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
