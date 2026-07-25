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
    const statusFilter = searchParams.get('status'); // e.g. "pending" | "approved" | "rejected"

    const whereClause: any = {};
    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    const leaves = await db.leaveRequest.findMany({
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
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ leaves });
  } catch (error) {
    console.error('Fetch admin leaves error:', error);
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

    const { id, status } = await request.json();

    if (!id || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Data perubahan status tidak valid' }, { status: 400 });
    }

    // Get owner name
    const owner = await db.employee.findUnique({
      where: { id: payload.userId },
      select: { name: true },
    });

    const approvedByName = owner?.name || 'Owner';

    // 1. Fetch the leave request first
    const leaveRequest = await db.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Pengajuan cuti tidak ditemukan' }, { status: 404 });
    }

    // 2. Update status in LeaveRequest
    const updatedLeave = await db.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedBy: status === 'approved' ? approvedByName : null,
      },
    });

    // 3. If approved, automatically create or update attendance entries
    if (status === 'approved') {
      const start = new Date(leaveRequest.startDate);
      const end = new Date(leaveRequest.endDate);

      // Loop through all dates between start and end date
      let currentDate = new Date(start);
      while (currentDate <= end) {
        // Find or update attendance for this day
        const attStatus = leaveRequest.type === 'sakit' ? 'sakit' : 'cuti';

        // Set date to YYYY-MM-DD to avoid timezone shifts
        const targetDate = new Date(currentDate);

        await db.attendance.upsert({
          where: {
            employeeId_date: {
              employeeId: leaveRequest.employeeId,
              date: targetDate,
            },
          },
          update: {
            status: attStatus,
          },
          create: {
            employeeId: leaveRequest.employeeId,
            date: targetDate,
            status: attStatus,
          },
        });

        // Increment day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return NextResponse.json({ success: true, leave: updatedLeave });
  } catch (error) {
    console.error('Update admin leave error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
