import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';
import { Users, Building, Wallet, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import AdminCalendar from '@/components/ui/AdminCalendar';
import React from 'react';

const formatIDR = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = await verifyJWT(token);
  if (!payload || payload.role !== 'owner') {
    redirect('/login');
  }

  // Current Month Period (e.g. "2026-07")
  const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // Gather stats in parallel
  const [employeeCount, positionCount, salaryAggregation] = await Promise.all([
    db.employee.count({ where: { role: 'employee' } }),
    db.position.count(),
    db.payslip.aggregate({
      where: { period: currentPeriod },
      _sum: { netSalary: true },
    })
  ]);

  const totalPaidSalary = salaryAggregation._sum.netSalary || 0;

  const cards = [
    {
      title: 'Data Karyawan',
      value: `${employeeCount} Karyawan`,
      description: 'Total staf aktif terdaftar',
      icon: Users,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
      link: '/admin/employees'
    },
    {
      title: 'Data Jabatan',
      value: `${positionCount} Jabatan`,
      description: 'Struktur organisasi aktif',
      icon: Building,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      link: '/admin/positions'
    },
    {
      title: 'Total Gaji Terbayar',
      value: formatIDR(totalPaidSalary),
      description: `Periode berjalan (${currentPeriod})`,
      icon: Wallet,
      color: 'text-emerald-450 bg-emerald-500/10 border-emerald-500/20',
      link: '/admin/transactions/salaries'
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          Dashboard Manajemen Owner
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link key={idx} href={card.link} className="group block bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-md transition-all hover:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{card.title}</p>
                  <p className="text-lg font-bold text-slate-100 group-hover:text-violet-300 transition truncate tracking-tight font-mono">
                    {card.value}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{card.description}</p>
                </div>
                <div className={`p-3 rounded-xl border shrink-0 ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider group-hover:text-slate-350 transition">
                <span>Kelola Data</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Calendar & Quick Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Calendar (Occupies 2 columns) */}
        <div className="lg:col-span-2">
          <AdminCalendar />
        </div>

        {/* Quick Operations Guide (Occupies 1 column) */}
        <div className="bg-slate-900/20 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-200">Panduan Operasional</h3>
              <p className="text-xs text-slate-500">Alur manajemen master data ke penggajian.</p>
            </div>
            
            <div className="space-y-3.5 text-xs text-slate-400">
              <div className="flex gap-2">
                <span className="w-5 h-5 shrink-0 rounded-full bg-violet-650/15 border border-violet-500/25 text-violet-300 flex items-center justify-center font-bold">1</span>
                <p className="leading-relaxed">Sesuaikan data jabatan di **Data Master Jabatan** dengan mengatur gaji pokok.</p>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 shrink-0 rounded-full bg-violet-655/15 border border-violet-500/25 text-violet-300 flex items-center justify-center font-bold">2</span>
                <p className="leading-relaxed">Daftarkan staff di **Data Karyawan** dengan NIK, foto profil, dan lampiran posisi.</p>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 shrink-0 rounded-full bg-violet-655/15 border border-violet-500/25 text-violet-300 flex items-center justify-center font-bold">3</span>
                <p className="leading-relaxed">Gunakan **Potongan Gaji** untuk memvalidasi pemotongan manual atau denda presensi.</p>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 shrink-0 rounded-full bg-violet-655/15 border border-violet-500/25 text-violet-300 flex items-center justify-center font-bold">4</span>
                <p className="leading-relaxed">Klik **Generate Gaji Bulanan** pada **Data Gaji** untuk kalkulasi final dan pencetakan slip.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-850/80 text-[10px] text-slate-500 text-center leading-relaxed">
            Sistem Payroll Karyawan Terintegrasi PT. Perusahaan Multinasional.
          </div>
        </div>

      </div>
    </div>
  );
}
