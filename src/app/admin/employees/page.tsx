'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, X, User, Mail, ShieldAlert, Loader2, Calendar, CreditCard, Image as ImageIcon, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const formatLongDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState('');

  // Form Fields
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [bankAccount, setBankAccount] = useState('');
  const [photo, setPhoto] = useState<string>('');
  const [entryDate, setEntryDate] = useState('');
  const [gender, setGender] = useState('Laki-laki');
  const [status, setStatus] = useState('Tetap');
  const [positionId, setPositionId] = useState('');

  // Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [empRes, posRes] = await Promise.all([
        fetch('/api/admin/employees'),
        fetch('/api/admin/positions'),
      ]);

      const empData = await empRes.json();
      const posData = await posRes.json();

      if (!empRes.ok) throw new Error(empData.error || 'Gagal memuat karyawan');
      if (!posRes.ok) throw new Error(posData.error || 'Gagal memuat jabatan');

      setEmployees(empData.employees);
      setPositions(posData.positions);

      if (posData.positions.length > 0 && !positionId) {
        setPositionId(posData.positions[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter & Pagination Logic
  const departments = Array.from(new Set(employees.map(e => e.position?.department).filter(Boolean)));

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = searchQuery.trim() === '' ||
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nik.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === '' || emp.position?.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEmployees = filteredEmployees.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const openAddModal = () => {
    setModalType('add');
    setNik('');
    setName('');
    setEmail('');
    setPassword('');
    setRole('employee');
    setBankAccount('');
    setPhoto('');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setGender('Laki-laki');
    setStatus('Tetap');
    if (positions.length > 0) setPositionId(positions[0].id);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (emp: any) => {
    setModalType('edit');
    setEditingId(emp.id);
    setNik(emp.nik);
    setName(emp.name);
    setEmail(emp.email);
    setPassword(''); // leave blank to keep old password
    setRole(emp.role);
    setBankAccount(emp.bankAccount);
    setPhoto(emp.photo || '');
    setEntryDate(new Date(emp.entryDate).toISOString().split('T')[0]);
    setGender(emp.gender);
    setStatus(emp.status);
    setPositionId(emp.positionId);
    setError('');
    setIsModalOpen(true);
  };

  // Convert uploaded photo to Base64 string for direct storage
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) { // Limit to 800KB to fit easily in Postgres Text/Base64
        setError('Ukuran foto terlalu besar. Maksimal 800 KB.');
        return;
      }
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      id: editingId,
      nik,
      name,
      email,
      password: password || undefined,
      role,
      bankAccount,
      photo: photo || null,
      entryDate,
      gender,
      status,
      positionId,
    };

    try {
      const endpoint = '/api/admin/employees';
      const method = modalType === 'add' ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data');

      setSuccess(modalType === 'add' ? 'Karyawan baru berhasil terdaftar!' : 'Data karyawan berhasil diperbarui!');
      setIsModalOpen(false);
      fetchData();

      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (emp: any) => {
    if (emp.email === 'owner@perusahaan.com') {
      alert('Akun Super Admin utama tidak dapat dihapus!');
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus data karyawan ${emp.name}?`)) return;
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/employees?id=${emp.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus');

      setSuccess('Data karyawan berhasil dihapus!');
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
            Data Master Karyawan
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Kelola arsip administrasi karyawan, NIK, penempatan jabatan, foto profil, dan status kerja.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-violet-600/20 active:scale-[0.98] transition-all duration-200 text-sm"
        >
          <Plus className="w-4.5 h-4.5" />
          Registrasi Karyawan
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 text-sm bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl flex items-center gap-2 animate-pulse">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 text-sm bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-xl flex items-center gap-2">
          <span>{success}</span>
        </div>
      )}

      {/* List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Table Header Controls */}
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/20">
          <div>
            <h2 className="text-lg font-bold text-slate-200">Daftar Karyawan Aktif</h2>
            <p className="text-xs text-slate-400 mt-0.5">Total {filteredEmployees.length} karyawan ditemukan</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 md:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Cari Nama / NIK..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            {/* Department Filter */}
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
              >
                <option value="">Semua Divisi</option>
                {departments.map((dept: any) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm">Memuat data karyawan...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-3">
              <User className="w-12 h-12 mx-auto text-slate-700" />
              <p className="font-semibold text-slate-400">Tidak ada karyawan yang cocok</p>
              <p className="text-xs max-w-sm mx-auto">Coba ubah kata kunci pencarian atau filter divisi yang dipilih.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-350">
              <thead className="bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-405 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Foto</th>
                  <th className="px-6 py-4">Karyawan (NIK)</th>
                  <th className="px-6 py-4">Jabatan / Divisi</th>
                  <th className="px-6 py-4">Tanggal Masuk</th>
                  <th className="px-6 py-4">Jenis Kelamin</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {paginatedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-900/30 transition duration-150">
                    <td className="px-6 py-4">
                      {emp.photo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={emp.photo}
                          alt={emp.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-750"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-xs">
                          {emp.name ? emp.name.charAt(0).toUpperCase() : 'K'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4.5 font-medium text-slate-200">
                      <div>{emp.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{emp.nik} • {emp.email}</div>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="font-semibold text-slate-300">{emp.position?.name}</div>
                      <div className="text-xs text-violet-400/80 font-medium">{emp.position?.department}</div>
                    </td>
                    <td className="px-6 py-4.5 font-mono text-xs">{formatLongDate(emp.entryDate)}</td>
                    <td className="px-6 py-4.5">{emp.gender}</td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${
                        emp.status === 'Tetap'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all inline-flex items-center cursor-pointer"
                        title="Edit Karyawan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp)}
                        className="p-2 rounded-lg bg-red-950/20 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/30 transition-all inline-flex items-center cursor-pointer"
                        title="Hapus Karyawan"
                        disabled={emp.email === 'owner@perusahaan.com'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && filteredEmployees.length > 0 && (
          <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 bg-slate-950/30">
            <div className="flex items-center gap-2">
              <span>Menampilkan</span>
              <span className="font-bold text-slate-200">
                {Math.min((safeCurrentPage - 1) * pageSize + 1, filteredEmployees.length)}
              </span>
              <span>-</span>
              <span className="font-bold text-slate-200">
                {Math.min(safeCurrentPage * pageSize, filteredEmployees.length)}
              </span>
              <span>dari</span>
              <span className="font-bold text-slate-200">{filteredEmployees.length}</span>
              <span>karyawan</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Baris per halaman:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg font-mono text-slate-200 font-bold">
                  {safeCurrentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add/Edit Portaled to Body */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="text-lg font-bold text-slate-200">
                {modalType === 'add' ? 'Registrasi Karyawan Baru' : 'Perbarui Data Karyawan'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              {/* Photo Upload and Preview Section */}
              <div className="flex items-center gap-5 p-4 bg-slate-950/40 border border-slate-850 rounded-2xl">
                <div className="relative shrink-0">
                  {photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={photo}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center text-slate-400">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Foto Profil Karyawan
                  </span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer border border-slate-700 transition">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Pilih Foto (Maks 800 KB)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {photo && (
                    <button
                      type="button"
                      onClick={() => setPhoto('')}
                      className="block text-[10px] text-red-400 hover:underline"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Nomor Induk Karyawan (NIK)
                  </label>
                  <input
                    type="text"
                    required
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    placeholder="Contoh: 100002"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Nama Karyawan
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Joko Widodo"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Email Perusahaan
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="joko@perusahaan.com"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Password {modalType === 'edit' && '(Kosongkan jika tidak diubah)'}
                  </label>
                  <input
                    type="password"
                    required={modalType === 'add'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Jabatan (Master Data)
                  </label>
                  <select
                    value={positionId}
                    onChange={(e) => setPositionId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  >
                    {positions.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.name} ({pos.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Tanggal Masuk Kerja
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="date"
                      required
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Jenis Kelamin
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-205 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Status Kepegawaian
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-205 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  >
                    <option value="Tetap">Karyawan Tetap</option>
                    <option value="Kontrak">Karyawan Kontrak</option>
                    <option value="Magang">Magang / Intern</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Rekening Bank Karyawan
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <CreditCard className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Contoh: BCA - 987654"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Hak Akses System
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-205 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  >
                    <option value="employee">Karyawan (Akses Portal Biasa)</option>
                    <option value="owner">Owner / Super Admin (Akses Sidebar Lengkap)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-4 flex items-center justify-center py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 text-sm cursor-pointer"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Simpan Data Karyawan'
                )}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
