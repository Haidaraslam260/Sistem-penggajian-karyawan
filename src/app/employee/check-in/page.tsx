'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, ShieldAlert, Loader2, CheckCircle2, Clock, Navigation } from 'lucide-react';

export default function CheckInPage() {
  const router = useRouter();
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('Mengambil status absensi...');

  // Geolocation states
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Attendance state
  const [attendance, setAttendance] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/attendance/check-in');
      const data = await res.json();
      if (res.ok && data.attendance) {
        setAttendance(data.attendance);
      }
    } catch (err) {
      console.error(err);
      setStatusText('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const requestLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Browser Anda tidak mendukung Geolocation'));
        return;
      }
      setGeoLoading(true);
      setGeoError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setCoords(newCoords);
          setGeoLoading(false);
          resolve(newCoords);
        },
        (error) => {
          let msg = 'Gagal mengakses lokasi Anda';
          if (error.code === error.PERMISSION_DENIED) msg = 'Akses lokasi ditolak. Harap izinkan akses GPS lokasi pada browser Anda.';
          setGeoError(msg);
          setGeoLoading(false);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const handleAction = async () => {
    setSubmitting(true);
    setGeoError(null);
    try {
      const position = await requestLocation();
      const actionType = !attendance ? 'in' : 'out';

      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          latitude: position.latitude,
          longitude: position.longitude,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan absensi');

      setAttendance(data.attendance);
      router.refresh();
    } catch (err: any) {
      setGeoError(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  let buttonLabel = !attendance ? 'Clock In' : 'Clock Out';
  let buttonColor = !attendance
    ? 'from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/25 ring-emerald-500/20'
    : 'from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 shadow-rose-500/25 ring-rose-500/20';
  let isCompleted = attendance?.clockIn && attendance?.clockOut;

  return (
    <div className="max-w-md mx-auto space-y-8 py-4 animate-fadeIn">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Presensi Mandiri</h1>
        <p className="text-slate-400 text-sm">Verifikasi kehadiran dan lokasi GPS Anda secara langsung.</p>
      </div>

      {/* Clock Card */}
      <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center shadow-xl">
        <div className="absolute top-[-40%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[80px] -z-10" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1.5 mb-2">
          <Clock className="w-3.5 h-3.5 text-violet-500" /> Waktu Lokal
        </p>
        <p className="text-5xl font-mono font-bold tracking-tight text-slate-100 mb-1">{time || '00:00:00'}</p>
        <p className="text-sm font-medium text-slate-400">{dateStr || 'Memuat tanggal...'}</p>
      </div>

      {loading ? (
        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <p className="text-sm">{statusText}</p>
        </div>
      ) : isCompleted ? (
        <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-3xl p-8 text-center space-y-6 shadow-xl">
          <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-200">Presensi Selesai!</h3>
            <p className="text-sm text-slate-400 mt-1">Anda telah melakukan Clock In & Clock Out untuk hari ini.</p>
          </div>
          <div className="pt-4 border-t border-slate-800/60 grid grid-cols-2 gap-6 text-xs font-mono text-slate-400">
            <div>
              <p className="text-slate-500 font-bold mb-1">CLOCK IN</p>
              <p className="text-sm font-semibold text-emerald-400">{new Date(attendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="text-slate-500 font-bold mb-1">CLOCK OUT</p>
              <p className="text-sm font-semibold text-rose-400">{new Date(attendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 text-center space-y-8 shadow-xl relative">
          {/* Action Button */}
          <div className="flex justify-center py-2">
            <button
              onClick={handleAction}
              disabled={submitting || geoLoading}
              className={`w-40 h-40 rounded-full bg-gradient-to-tr ${buttonColor} text-white font-bold text-xl shadow-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none ring-8 relative group cursor-pointer`}
            >
              {submitting || geoLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-normal">Verifikasi Lokasi...</span>
                </div>
              ) : (
                <>
                  <Navigation className="w-7 h-7 mb-0.5 group-hover:scale-110 transition duration-200" />
                  <span>{buttonLabel}</span>
                </>
              )}
            </button>
          </div>

          {/* GPS Info & Status */}
          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Lokasi GPS Anda akan diverifikasi otomatis sesuai dengan geofence radius kantor.
            </p>
            {coords && (
              <div className="p-3 bg-slate-950/80 rounded-2xl inline-flex items-center gap-2 border border-slate-800 text-xs font-mono text-emerald-400 shadow-inner">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>GPS Terdeteksi: {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}</span>
              </div>
            )}
            {geoError && (
              <div className="p-4 bg-red-950/30 border border-red-800/50 text-red-300 text-xs rounded-2xl flex items-start gap-2.5 max-w-sm mx-auto text-left leading-relaxed shadow-lg">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{geoError}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
