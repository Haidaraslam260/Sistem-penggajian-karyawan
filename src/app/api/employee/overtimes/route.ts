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
    if (!payload || payload.role !== 'employee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const overtimes = await db.overtime.findMany({
      where: {
        employeeId: payload.userId,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({ overtimes });
  } catch (error) {
    console.error('Fetch employee overtimes error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'employee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date, hours, reason } = await request.json();

    if (!date || hours === undefined || !reason) {
      return NextResponse.json({ error: 'Data klaim lembur tidak lengkap' }, { status: 400 });
    }

    const overtimeDate = new Date(date);
    const overtimeHours = parseFloat(hours);

    if (isNaN(overtimeDate.getTime())) {
      return NextResponse.json({ error: 'Format tanggal tidak valid' }, { status: 400 });
    }

    if (isNaN(overtimeHours) || overtimeHours <= 0) {
      return NextResponse.json({ error: 'Jumlah jam lembur harus berupa angka positif' }, { status: 400 });
    }

    // Check if overtime for this date already exists
    const existingOvertime = await db.overtime.findUnique({
      where: {
        employeeId_date: {
          employeeId: payload.userId,
          date: overtimeDate,
        },
      },
    });

    if (existingOvertime) {
      return NextResponse.json({ error: 'Klaim lembur untuk tanggal ini sudah diajukan' }, { status: 400 });
    }

    const newOvertime = await db.overtime.create({
      data: {
        employeeId: payload.userId,
        date: overtimeDate,
        hours: overtimeHours,
        ratePerHour: 0,
        totalPay: 0,
        reason,
        status: 'pending',
      },
    });

    return NextResponse.json({ success: true, overtime: newOvertime });
  } catch (error) {
    console.error('Create employee overtime error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
