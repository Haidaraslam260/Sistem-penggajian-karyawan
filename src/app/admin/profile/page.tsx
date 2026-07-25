'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Briefcase,
  CreditCard,
  Calendar,
  Lock,
  Mail,
  BadgeCheck,
  Camera,
  Image as ImageIcon,
  Edit2,
  Save,
} from 'lucide-react';

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Editable Name State
  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [updatingName, setUpdatingName] = useState(false);

  // Editable Photo State
  const [photo, setPhoto] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Editable Bank Account State
  const [bankAccount, setBankAccount] = useState('');
  const [editingBank, setEditingBank] = useState(false);
  const [updatingBank, setUpdatingBank] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Alerts
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/employee/profile');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat profil');
      setProfile(data.profile);
      setName(data.profile.name || '');
      setPhoto(data.profile.photo || '');
      setBankAccount(data.profile.bankAccount || '');
    } catch (err: any) {
      setFetchError(err.message || 'Gagal memuat profil admin/owner');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      alert('Ukuran foto terlalu besar. Maksimal 800 KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPhoto(base64);
      setUploadingPhoto(true);
      try {
        const res = await fetch('/api/employee/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo: base64 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menyimpan foto');
        setProfileSuccess('Foto profil berhasil diperbarui!');
        fetchProfile();
        setTimeout(() => setProfileSuccess(''), 4000);
      } catch (err: any) {
        alert(err.message || 'Gagal mengunggah foto');
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setUpdatingName(true);
    try {
      const res = await fetch('/api/employee/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui nama');

      setProfileSuccess('Nama akun berhasil diperbarui!');
      setEditingName(false);
      fetchProfile();
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui nama');
    } finally {
      setUpdatingName(false);
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingBank(true);
    try {
      const res = await fetch('/api/employee/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankAccount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui nomor rekening');

      setProfileSuccess('Nomor rekening bank berhasil diperbarui!');
      setEditingBank(false);
      fetchProfile();
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui rekening');
    } finally {
      setUpdatingBank(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentPassword) {
      setPassError('Masukkan kata sandi saat ini');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('Kata sandi baru minimal harus 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Konfirmasi kata sandi baru tidak cocok');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/employee/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui kata sandi');

      setPassSuccess('Kata sandi berhasil diperbarui! Gunakan kata sandi baru untuk login selanjutnya.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(''), 5000);
    } catch (err: any) {
      setPassError(err.message || 'Gagal memperbarui kata sandi');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        <p className="text-sm text-slate-400">Memuat profil pengelola...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800/60 rounded-2xl text-red-300 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        <span>{fetchError}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <User className="w-8 h-8 text-violet-400" />
          Profil Pribadi & Pengaturan Akun Owner
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Kelola foto profil, informasi identitas, nomor rekening penggajian, dan kata sandi akun Anda.
        </p>
      </div>

      {profileSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-2xl text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{profileSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

            {/* Avatar & Photo Upload (Entire Circle Clickable) */}
            <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-slate-800">
              <label
                htmlFor="admin-photo-upload"
                className="relative group cursor-pointer block"
                title="Klik foto untuk mengubah foto profil"
              >
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-violet-950/50 border-4 border-slate-800 transition-all duration-300 group-hover:border-violet-500 overflow-hidden relative">
                  {photo ? (
                    <img src={photo} alt={profile?.name} className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:brightness-90" />
                  ) : (
                    <span className="transition-all duration-300 group-hover:scale-110">{profile?.name ? profile.name.charAt(0).toUpperCase() : 'O'}</span>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white space-y-1 backdrop-blur-[2px]">
                    {uploadingPhoto ? (
                      <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-violet-300" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-200">Ganti Foto</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Camera Badge Icon */}
                <div className="absolute bottom-0 right-0 p-2.5 bg-violet-600 group-hover:bg-violet-500 text-white rounded-full border-2 border-slate-900 shadow-lg transition-all flex items-center justify-center group-hover:scale-110">
                  {uploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </div>

                <input
                  id="admin-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
              </label>

              {/* Editable Name */}
              <div className="w-full">
                {editingName ? (
                  <form onSubmit={handleNameSubmit} className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                    <button
                      type="submit"
                      disabled={updatingName}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                      title="Simpan Nama"
                    >
                      {updatingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-xl font-bold text-slate-100">{profile?.name}</h2>
                    <button
                      onClick={() => setEditingName(true)}
                      className="p-1 text-slate-400 hover:text-violet-400 transition"
                      title="Edit Nama Akun"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded-full text-xs font-semibold mt-2">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Role: Owner / Super Admin
                </span>
              </div>
            </div>

            {/* Profile Info Fields */}
            <div className="pt-6 space-y-4 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-slate-500" /> NIK Pengelola
                </span>
                <span className="font-mono font-semibold text-slate-200">{profile?.nik}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-500" /> Jabatan
                </span>
                <span className="font-semibold text-slate-200">{profile?.position?.name}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500" /> Divisi
                </span>
                <span className="font-semibold text-slate-200">{profile?.position?.department}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" /> Email Akses
                </span>
                <span className="font-semibold text-slate-200">{profile?.email}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" /> Bergabung Sejak
                </span>
                <span className="font-semibold text-slate-200">
                  {profile?.entryDate ? new Date(profile.entryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Account Details Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Rekening Pembayaran Gaji
              </h3>
              {!editingBank && (
                <button
                  onClick={() => setEditingBank(true)}
                  className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition cursor-pointer"
                >
                  Ubah
                </button>
              )}
            </div>

            {editingBank ? (
              <form onSubmit={handleBankSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Nama Bank & Nomor Rekening
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Contoh: BCA - 1234567890"
                    required
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={updatingBank}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {updatingBank ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Simpan Rekening'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingBank(false); setBankAccount(profile?.bankAccount || ''); }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 p-4 bg-slate-950/60 border border-slate-850 rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Rekening Bank Terdaftar</p>
                <p className="text-base font-mono font-bold text-emerald-400 mt-1">{profile?.bankAccount || 'Belum diisi'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Password Change Form */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Ubah Kata Sandi Akun Owner</h3>
                <p className="text-xs text-slate-400">
                  Perbarui kata sandi utama pengelola aplikasi secara berkala demi keamanan super admin.
                </p>
              </div>
            </div>

            {/* Password Alerts */}
            {passError && (
              <div className="mt-6 p-4 bg-red-950/40 border border-red-800/60 text-red-300 rounded-2xl text-xs flex items-center gap-2.5 animate-pulse">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="mt-6 p-4 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-2xl text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Kata Sandi Saat Ini <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi lama Anda"
                    required
                    className="w-full pl-10 pr-12 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Kata Sandi Baru <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    className="w-full pl-10 pr-12 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Konfirmasi Kata Sandi Baru <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    required
                    className="w-full pl-10 pr-12 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirement Guidance */}
              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl text-xs space-y-2 text-slate-400">
                <p className="font-semibold text-slate-300">Ketentuan Kata Sandi:</p>
                <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-400">
                  <li className={newPassword.length >= 6 ? 'text-emerald-400 font-semibold' : ''}>
                    Panjang minimal 6 karakter
                  </li>
                  <li className={newPassword && newPassword === confirmPassword ? 'text-emerald-400 font-semibold' : ''}>
                    Kata sandi baru & konfirmasi harus sama persis
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-violet-950/50 border border-violet-500/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memperbarui Kata Sandi...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Simpan Kata Sandi Baru</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
