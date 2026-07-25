import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';
import { CalendarCheck, AlertTriangle, Activity, UserMinus, Plus } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

// Date formatter in Indonesian
const formatLongDate = (date: Date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (date: Date | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export default async function EmployeeDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    redirect('/login');
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Fetch all attendance for this employee this month
  const attendances = await db.attendance.findMany({
    where: {
      employeeId: payload.userId,
      date: {
        gte: startOfMonth,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  // Calculate stats
  const stats = {
    hadir: attendances.filter(a => a.status === 'hadir').length,
    terlambat: attendances.filter(a => a.status === 'terlambat').length,
    sakit: attendances.filter(a => a.status === 'sakit').length,
    cuti: attendances.filter(a => a.status === 'cuti').length,
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Dashboard Kehadiran
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Riwayat absensi dan data kehadiran Anda bulan ini.
          </p>
        </div>
        <Link
          href="/employee/check-in"
          className="flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-violet-600/20 active:scale-[0.98] transition-all duration-200 text-sm"
        >
          <Plus className="w-4 h-4" />
          Clock In / Out Baru
        </Link>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hadir */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hadir</p>
            <p className="text-3xl font-bold text-emerald-400">{stats.hadir}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Terlambat */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Terlambat</p>
            <p className="text-3xl font-bold text-amber-500">{stats.terlambat}</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Sakit */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sakit</p>
            <p className="text-3xl font-bold text-sky-400">{stats.sakit}</p>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Cuti */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cuti</p>
            <p className="text-3xl font-bold text-violet-400">{stats.cuti}</p>
          </div>
          <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl">
            <UserMinus className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-200">Riwayat Absensi Bulan Ini</h2>
          <p className="text-xs text-slate-500 mt-1">Daftar kehadiran harian yang tercatat.</p>
        </div>

        <div className="overflow-x-auto">
          {attendances.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <CalendarCheck className="w-12 h-12 mx-auto text-slate-700" />
              <p className="font-semibold text-slate-400">Belum ada riwayat absensi</p>
              <p className="text-xs max-w-sm mx-auto">Silakan lakukan Clock In pada hari kerja Anda untuk mulai melacak kehadiran.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Jam Masuk</th>
                  <th className="px-6 py-4">Jam Keluar</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 hidden md:table-cell">Koordinat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {attendances.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/30 transition duration-150">
                    <td className="px-6 py-4.5 font-medium text-slate-200">
                      {formatLongDate(item.date)}
                    </td>
                    <td className="px-6 py-4.5 text-emerald-400 font-mono">
                      {formatTime(item.clockIn)}
                    </td>
                    <td className="px-6 py-4.5 text-rose-400 font-mono">
                      {formatTime(item.clockOut)}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                        item.status === 'hadir' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        item.status === 'terlambat' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        item.status === 'sakit' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                        item.status === 'cuti' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 hidden md:table-cell text-xs text-slate-500 font-mono">
                      {item.latitudeIn && item.longitudeIn ? (
                        <span>
                          IN: {item.latitudeIn.toFixed(4)}, {item.longitudeIn.toFixed(4)}
                          {item.latitudeOut && item.longitudeOut && (
                            <span className="block">
                              OUT: {item.latitudeOut.toFixed(4)}, {item.longitudeOut.toFixed(4)}
                            </span>
                          )}
                        </span>
                      ) : (
                        '-'
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
