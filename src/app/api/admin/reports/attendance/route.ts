import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const [yearStr, monthStr] = period.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const employees = await db.employee.findMany({
      where: { role: 'employee' },
      include: {
        position: true,
        attendances: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const report = employees.map((emp) => {
      const counts = {
        hadir: emp.attendances.filter(a => a.status === 'hadir').length,
        terlambat: emp.attendances.filter(a => a.status === 'terlambat').length,
        sakit: emp.attendances.filter(a => a.status === 'sakit').length,
        cuti: emp.attendances.filter(a => a.status === 'cuti').length,
        alpa: emp.attendances.filter(a => a.status === 'alpa').length,
      };

      const totalActive = counts.hadir + counts.terlambat + counts.sakit + counts.cuti + counts.alpa;
      const presentDays = counts.hadir + counts.terlambat;
      const rate = totalActive > 0 ? (presentDays / totalActive) * 100 : 0;

      return {
        id: emp.id,
        nik: emp.nik,
        name: emp.name,
        position: emp.position,
        counts,
        rate: Math.round(rate),
      };
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Fetch attendance report error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 550 });
  }
}
