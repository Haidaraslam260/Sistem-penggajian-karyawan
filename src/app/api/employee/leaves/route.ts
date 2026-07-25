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

    const leaves = await db.leaveRequest.findMany({
      where: {
        employeeId: payload.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ leaves });
  } catch (error) {
    console.error('Fetch employee leaves error:', error);
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

    const { type, startDate, endDate, reason, attachment } = await request.json();

    if (!type || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Data pengajuan tidak lengkap' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Format tanggal tidak valid' }, { status: 400 });
    }

    if (start > end) {
      return NextResponse.json({ error: 'Tanggal mulai tidak boleh melebihi tanggal selesai' }, { status: 400 });
    }

    const newLeave = await db.leaveRequest.create({
      data: {
        employeeId: payload.userId,
        type,
        startDate: start,
        endDate: end,
        reason,
        attachment: attachment || null,
        status: 'pending',
      },
    });

    return NextResponse.json({ success: true, leave: newLeave });
  } catch (error) {
    console.error('Create employee leave error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
