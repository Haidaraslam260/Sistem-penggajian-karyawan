'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, ShieldAlert, Loader2, CheckCircle2, Clock, Camera } from 'lucide-react';

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

  // Camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);

  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 300, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Gagal mengakses kamera. Harap izinkan akses kamera di browser Anda untuk melakukan absensi.');
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = (activeStream: MediaStream | null) => {
    const currentStream = activeStream || stream;
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/attendance/check-in');
      const data = await res.json();
      if (res.ok && data.attendance) {
        setAttendance(data.attendance);
        if (!(data.attendance.clockIn && data.attendance.clockOut)) {
          startCamera();
        }
      } else {
        startCamera();
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
    return () => {
      stopCamera(null);
    };
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
          if (error.code === error.PERMISSION_DENIED) msg = 'Akses lokasi ditolak.';
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
      if (!videoRef.current || !stream) {
        throw new Error('Kamera belum siap atau tidak aktif. Harap izinkan akses kamera.');
      }
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Gagal memproses gambar dari kamera.');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoBase64 = canvas.toDataURL('image/jpeg', 0.85);

      const position = await requestLocation();
      const actionType = !attendance ? 'in' : 'out';

      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          latitude: position.latitude,
          longitude: position.longitude,
          photo: photoBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan absensi');

      setAttendance(data.attendance);
      if (data.attendance.clockIn && data.attendance.clockOut) stopCamera(stream);
      router.refresh();
    } catch (err: any) {
      setGeoError(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  let buttonLabel = !attendance ? 'Clock In' : 'Clock Out';
  let buttonColor = !attendance ? 'from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/20' : 'from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 shadow-rose-500/20';
  let isCompleted = attendance?.clockIn && attendance?.clockOut;

  return (
    <div className="max-w-md mx-auto space-y-8 py-4 animate-fadeIn">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Presensi Mandiri</h1>
        <p className="text-slate-400 text-sm">Absen masuk dan pulang langsung via perangkat Anda.</p>
      </div>

      <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center shadow-xl">
        <div className="absolute top-[-40%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[80px] -z-10" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1.5 mb-2"><Clock className="w-3.5 h-3.5 text-violet-500" /> Waktu Lokal</p>
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
            <div className="space-y-3">
              <div><p>CLOCK IN</p><p className="text-sm font-semibold text-emerald-400 mt-0.5">{new Date(attendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p></div>
              {attendance.photoIn && <div className="rounded-xl overflow-hidden border border-slate-800/80 aspect-[4/3] bg-slate-950 shadow-md"><img src={attendance.photoIn} alt="Foto Masuk" className="w-full h-full object-cover scale-x-[-1]" /></div>}
            </div>
            <div className="space-y-3">
              <div><p>CLOCK OUT</p><p className="text-sm font-semibold text-rose-400 mt-0.5">{new Date(attendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p></div>
              {attendance.photoOut && <div className="rounded-xl overflow-hidden border border-slate-800/80 aspect-[4/3] bg-slate-950 shadow-md"><img src={attendance.photoOut} alt="Foto Keluar" className="w-full h-full object-cover scale-x-[-1]" /></div>}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/30 border border-slate-850 rounded-3xl p-6 text-center space-y-6 shadow-xl relative">
          <div className="relative aspect-[4/3] w-full max-w-sm mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-805 flex items-center justify-center text-slate-500 shadow-inner">
            {cameraLoading ? (
              <div className="flex flex-col items-center gap-2"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /><span className="text-xs">Mengaktifkan kamera...</span></div>
            ) : cameraError ? (
              <div className="p-4 text-center text-xs text-red-405 space-y-2"><ShieldAlert className="w-8 h-8 mx-auto text-red-500" /><p>{cameraError}</p><button type="button" onClick={startCamera} className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-750 transition cursor-pointer">Coba Lagi</button></div>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800 text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5 animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Kamera Aktif</div>
              </>
            )}
          </div>
          <div className="flex justify-center">
            <button onClick={handleAction} disabled={submitting || cameraLoading || !!cameraError} className={`w-36 h-36 rounded-full bg-gradient-to-tr ${buttonColor} text-white font-bold text-lg shadow-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none relative group cursor-pointer`}>
              {submitting ? <Loader2 className="w-8 h-8 animate-spin" /> : <><Camera className="w-6 h-6 mb-0.5 group-hover:scale-110 transition" /><span>{buttonLabel}</span></>}
            </button>
          </div>
          <div className="space-y-3">
            <p className="text-xs text-slate-500 max-w-xs mx-auto">Swafoto wajah dan koordinat Geolocation GPS Anda diperlukan untuk memverifikasi absensi harian Anda.</p>
            {coords && <div className="p-2.5 bg-slate-950/80 rounded-xl inline-flex items-center gap-2 border border-slate-800 text-xs font-mono text-emerald-400"><MapPin className="w-3.5 h-3.5 text-emerald-500" /><span>GPS: {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}</span></div>}
            {geoError && <div className="p-4 bg-red-955/20 border border-red-800/40 text-red-300 text-xs rounded-xl flex items-start gap-2 max-w-sm mx-auto text-left leading-relaxed"><ShieldAlert className="w-4 h-4 shrink-0 text-red-400" /><span>{geoError}</span></div>}
          </div>
        </div>
      )}
    </div>
  );
}
