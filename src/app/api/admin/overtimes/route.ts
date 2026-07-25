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
    const statusFilter = searchParams.get('status');

    const whereClause: any = {};
    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    const overtimes = await db.overtime.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            name: true,
            nik: true,
            position: {
              select: {
                name: true,
                department: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({ overtimes });
  } catch (error) {
    console.error('Fetch admin overtimes error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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

    const { id, status, ratePerHour } = await request.json();

    if (!id || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Data perubahan status tidak valid' }, { status: 400 });
    }

    // Get owner name
    const owner = await db.employee.findUnique({
      where: { id: payload.userId },
      select: { name: true },
    });

    const approvedByName = owner?.name || 'Owner';

    // 1. Fetch the overtime claim first
    const overtimeRequest = await db.overtime.findUnique({
      where: { id },
    });

    if (!overtimeRequest) {
      return NextResponse.json({ error: 'Pengajuan lembur tidak ditemukan' }, { status: 404 });
    }

    let calculatedRate = 0;
    let calculatedTotalPay = 0;

    if (status === 'approved') {
      calculatedRate = parseFloat(ratePerHour);
      if (isNaN(calculatedRate) || calculatedRate < 0) {
        return NextResponse.json({ error: 'Tarif lembur per jam harus berupa angka valid' }, { status: 400 });
      }
      calculatedTotalPay = overtimeRequest.hours * calculatedRate;
    }

    // 2. Update status and calculations in Overtime
    const updatedOvertime = await db.overtime.update({
      where: { id },
      data: {
        status,
        ratePerHour: calculatedRate,
        totalPay: calculatedTotalPay,
        approvedBy: status === 'approved' ? approvedByName : null,
      },
    });

    return NextResponse.json({ success: true, overtime: updatedOvertime });
  } catch (error) {
    console.error('Update admin overtime error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
