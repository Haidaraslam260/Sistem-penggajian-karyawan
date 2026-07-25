'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, User, FileText, Loader2, Check, X, ShieldAlert, CheckCircle, Clock, XCircle, Search } from 'lucide-react';

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLeaves = async () => {
    setLoading(true);
    setError('');
    try {
      const url = statusFilter === 'all' 
        ? '/api/admin/leaves' 
        : `/api/admin/leaves?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat data pengajuan cuti');
      setLeaves(data.leaves);
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setActionId(id);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses pengajuan');

      setSuccess(`Pengajuan cuti berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}.`);
      fetchLeaves();
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah status pengajuan.');
    } finally {
      setActionId(null);
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
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

  const formatDateRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const options = { day: 'numeric', month: 'short', year: 'numeric' } as const;

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return `${start.toLocaleDateString('id-ID', options)} - ${end.toLocaleDateString('id-ID', options)} (${diffDays} hari)`;
  };

  const filteredLeaves = leaves.filter(l => 
    l.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.employee.nik.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
          Persetujuan Cuti & Izin
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Tinjau, setujui, atau tolak permohonan cuti dan izin sakit karyawan.
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
          <h2 className="text-lg font-bold text-slate-200">Daftar Pengajuan Cuti & Izin</h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm">Memuat data pengajuan cuti...</p>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-3">
              <Calendar className="w-12 h-12 mx-auto text-slate-700" />
              <p className="font-semibold text-slate-400">Tidak ada pengajuan cuti pada status ini</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Karyawan</th>
                  <th className="px-6 py-4">Departemen / Jabatan</th>
                  <th className="px-6 py-4">Tipe Izin</th>
                  <th className="px-6 py-4">Periode Tanggal</th>
                  <th className="px-6 py-4">Alasan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-900/10 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{leave.employee.name}</div>
                      <div className="text-[11px] text-slate-500">NIK: {leave.employee.nik}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300 font-medium">{leave.employee.position.name}</div>
                      <div className="text-[11px] text-slate-500">{leave.employee.position.department}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-200">
                      {formatType(leave.type)}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-300">
                      {formatDateRange(leave.startDate, leave.endDate)}
                    </td>
                    <td className="px-6 py-4 text-xs max-w-xs truncate" title={leave.reason}>
                      {leave.reason}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(leave.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {leave.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(leave.id, 'approved')}
                            disabled={actionId !== null}
                            className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 transition cursor-pointer"
                            title="Setujui Pengajuan"
                          >
                            {actionId === leave.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(leave.id, 'rejected')}
                            disabled={actionId !== null}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 transition cursor-pointer"
                            title="Tolak Pengajuan"
                          >
                            {actionId === leave.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">
                          {leave.status === 'approved' ? `Oleh: ${leave.approvedBy || 'Owner'}` : 'Telah Ditolak'}
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
