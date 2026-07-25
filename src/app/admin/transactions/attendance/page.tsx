'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Loader2, ShieldAlert, CheckCircle2, AlertCircle, Camera } from 'lucide-react';

const formatLongDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatTime = (timeString: string | null) => {
  if (!timeString) return '-';
  return new Date(timeString).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export default function AdminTransactionsAttendancePage() {
  const [selectedDate, setSelectedDate] = useState('');
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSelfie, setSelectedSelfie] = useState<{ name: string; nik: string; photoIn: string | null; photoOut: string | null } | null>(null);

  // Initialize with today's local date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  const fetchAttendance = async (date: string) => {
    if (!date) return;
    setLoading(true);
    setError('');
    try {
      // Fetch attendance logs for specific date
      const res = await fetch(`/api/admin/transactions/attendance?date=${date}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat absensi');
      setAttendanceList(data.attendances);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data absensi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
            Transaksi Kehadiran Karyawan
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Arsip lengkap presensi karyawan harian.
          </p>
        </div>

        {/* Date Selector */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
            <Calendar className="w-4 h-4" />
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 text-sm bg-red-955/20 border border-red-800/40 text-red-300 rounded-xl flex items-center gap-2 animate-pulse">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          {error}
        </div>
      )}

      {/* Stats indicators */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Karyawan</p>
            <p className="text-2xl font-bold text-slate-200 mt-1">{attendanceList.length}</p>
          </div>
          <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 font-semibold uppercase">Hadir</p>
            <p className="text-2xl font-bold text-emerald-450 mt-1">
              {attendanceList.filter((a) => a.attendance?.status === 'hadir').length}
            </p>
          </div>
          <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 font-semibold uppercase">Terlambat</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">
              {attendanceList.filter((a) => a.attendance?.status === 'terlambat').length}
            </p>
          </div>
          <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 font-semibold uppercase">Alpa / Belum Absen</p>
            <p className="text-2xl font-bold text-rose-500 mt-1">
              {attendanceList.filter((a) => !a.attendance).length}
            </p>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-200">
            Detail Presensi Tanggal {selectedDate ? formatLongDate(selectedDate) : ''}
          </h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-555 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm">Memuat log kehadiran...</p>
            </div>
          ) : attendanceList.length === 0 ? (
            <div className="p-12 text-center text-slate-550">
              Tidak ada data karyawan yang terdaftar.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-350">
              <thead className="bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-405 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Karyawan (NIK)</th>
                  <th className="px-6 py-4">Jabatan</th>
                  <th className="px-6 py-4">Jam Masuk</th>
                  <th className="px-6 py-4">Jam Keluar</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Swafoto</th>
                  <th className="px-6 py-4">GPS Clock In</th>
                  <th className="px-6 py-4">GPS Clock Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {attendanceList.map((emp) => {
                  const att = emp.attendance;
                  return (
                     <tr key={emp.id} className="hover:bg-slate-900/30 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">{emp.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">NIK: {emp.nik}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-300">{emp.position.name}</div>
                        <div className="text-xs text-slate-500">{emp.position.department}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-emerald-450">
                        {att ? formatTime(att.clockIn) : '-'}
                      </td>
                      <td className="px-6 py-4 font-mono text-rose-450">
                        {att ? formatTime(att.clockOut) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {att ? (
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                            att.status === 'hadir' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            att.status === 'terlambat' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            att.status === 'sakit' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                            att.status === 'cuti' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {att.status}
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider bg-slate-800/40 text-slate-500 border border-slate-850">
                            Belum Absen
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {att && (att.photoIn || att.photoOut) ? (
                          <button
                            onClick={() => setSelectedSelfie({
                              name: emp.name,
                              nik: emp.nik,
                              photoIn: att.photoIn,
                              photoOut: att.photoOut
                            })}
                            className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg shadow transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Lihat Foto</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-550">
                        {att?.latitudeIn && att?.longitudeIn ? (
                          <a
                            href={`https://www.google.com/maps?q=${att.latitudeIn},${att.longitudeIn}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-violet-400 hover:underline hover:text-violet-300"
                          >
                            <MapPin className="w-3.5 h-3.5 text-violet-500" />
                            {att.latitudeIn.toFixed(4)}, {att.longitudeIn.toFixed(4)}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-550">
                        {att?.latitudeOut && att?.longitudeOut ? (
                          <a
                            href={`https://www.google.com/maps?q=${att.latitudeOut},${att.longitudeOut}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-rose-450 hover:underline hover:text-rose-350"
                          >
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            {att.latitudeOut.toFixed(4)}, {att.longitudeOut.toFixed(4)}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Selfie Preview Modal */}
      {selectedSelfie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 relative">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-200">Swafoto Kehadiran</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedSelfie.name} (NIK: {selectedSelfie.nik})</p>
              </div>
              <button
                onClick={() => setSelectedSelfie(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-center">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Foto Masuk (Clock In)</p>
                {selectedSelfie.photoIn ? (
                  <div className="rounded-2xl overflow-hidden border border-slate-800 aspect-[4/3] bg-slate-950 shadow-inner">
                    <img src={selectedSelfie.photoIn} alt="Swafoto Masuk" className="w-full h-full object-cover scale-x-[-1]" />
                  </div>
                ) : (
                  <div className="rounded-2xl aspect-[4/3] bg-slate-950 border border-slate-800/40 flex items-center justify-center text-xs text-slate-600 font-medium">
                    Belum Clock In
                  </div>
                )}
              </div>
              
              <div className="space-y-2 text-center">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Foto Keluar (Clock Out)</p>
                {selectedSelfie.photoOut ? (
                  <div className="rounded-2xl overflow-hidden border border-slate-800 aspect-[4/3] bg-slate-950 shadow-inner">
                    <img src={selectedSelfie.photoOut} alt="Swafoto Keluar" className="w-full h-full object-cover scale-x-[-1]" />
                  </div>
                ) : (
                  <div className="rounded-2xl aspect-[4/3] bg-slate-950 border border-slate-800/40 flex items-center justify-center text-xs text-slate-600 font-medium">
                    Belum Clock Out
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedSelfie(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-750 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
