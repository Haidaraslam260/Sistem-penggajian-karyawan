import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';
import { MapPin, Search, AlertCircle, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import React from 'react';

const formatLongDate = (date: Date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (date: Date | null | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export default async function AdminAttendancePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = await verifyJWT(token);
  if (!payload || payload.role !== 'owner') {
    redirect('/login');
  }

  // Today's date normalized
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Fetch all employees (karyawan biasa)
  // and load their attendance for today (if any)
  const employees = await db.employee.findMany({
    where: {
      role: 'employee',
    },
    include: {
      position: true,
      attendances: {
        where: {
          date: today,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
            Pemantauan Absensi Hari Ini
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Tanggal: {formatLongDate(new Date())} (Real-Time)
          </p>
        </div>
        
        {/* Simple refresh fallback */}
        <LinkButton />
      </div>

      {/* Attendance Table */}
      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-200">Kehadiran Seluruh Karyawan</h2>
            <p className="text-xs text-slate-500 mt-1">Daftar presensi seluruh karyawan aktif untuk hari kerja hari ini.</p>
          </div>
          
          {/* Quick stats indicator */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              Clocked In:{' '}
              <strong className="text-slate-200">
                {employees.filter((emp: any) => emp.attendances.length > 0).length}
              </strong>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              Belum Absen:{' '}
              <strong className="text-slate-200">
                {employees.filter((emp: any) => emp.attendances.length === 0).length}
              </strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {employees.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              Belum ada data karyawan terdaftar di database.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">NIK</th>
                  <th className="py-3.5 px-4">Nama Karyawan</th>
                  <th className="py-3.5 px-4">Jabatan & Divisi</th>
                  <th className="py-3.5 px-4">Jam Masuk</th>
                  <th className="py-3.5 px-4">Jam Keluar</th>
                  <th className="py-3.5 px-4">Status Absensi</th>
                  <th className="py-3.5 px-4 text-right">Lokasi Presensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                {employees.map((emp: any) => {
                  const att = emp.attendances[0]; // will be undefined if no attendance today
                  return (
                    <tr key={emp.id} className="hover:bg-slate-900/30 transition duration-150">
                      <td className="px-6 py-4.5 font-medium text-slate-200">
                        <div className="font-semibold text-slate-200">{emp.name}</div>
                        <div className="text-xs text-slate-550 font-mono mt-0.5">{emp.email}</div>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="text-slate-300">{emp.position.name}</div>
                        <div className="text-xs text-slate-500">{emp.position.department}</div>
                      </td>
                      <td className="px-6 py-4.5 font-mono text-emerald-450">
                        {formatTime(att?.clockIn)}
                      </td>
                      <td className="px-6 py-4.5 font-mono text-rose-400">
                        {formatTime(att?.clockOut)}
                      </td>
                      <td className="px-6 py-4.5">
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
                      <td className="px-6 py-4.5 font-mono text-xs text-slate-500">
                        {att?.latitudeIn && att?.longitudeIn ? (
                          <a
                            href={`https://www.google.com/maps?q=${att.latitudeIn},${att.longitudeIn}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-violet-400 hover:underline hover:text-violet-300"
                          >
                            <MapPin className="w-3 h-3 text-violet-500" />
                            {att.latitudeIn.toFixed(4)}, {att.longitudeIn.toFixed(4)}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4.5 font-mono text-xs text-slate-500">
                        {att?.latitudeOut && att?.longitudeOut ? (
                          <a
                            href={`https://www.google.com/maps?q=${att.latitudeOut},${att.longitudeOut}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-rose-450 hover:underline hover:text-rose-305"
                          >
                            <MapPin className="w-3 h-3 text-rose-500" />
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
    </div>
  );
}

// Quick reload helper
function LinkButton() {
  return (
    <a
      href="/admin/attendance"
      className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-slate-100 font-semibold rounded-xl transition duration-150 text-sm"
    >
      <RefreshCw className="w-4 h-4" />
      Perbarui Data
    </a>
  );
}
