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

    // Get date parameter
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json({ error: 'Tanggal parameter wajib ada' }, { status: 400 });
    }

    // Normalize date to UTC 00:00:00
    const queryDate = new Date(dateStr);
    queryDate.setUTCHours(0, 0, 0, 0);

    // Fetch all employees (role: employee)
    const employees = await db.employee.findMany({
      where: {
        role: 'employee',
      },
      include: {
        position: true,
        attendances: {
          where: {
            date: queryDate,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Map to a clean response shape
    const formatted = employees.map((emp) => ({
      id: emp.id,
      nik: emp.nik,
      name: emp.name,
      email: emp.email,
      position: emp.position,
      attendance: emp.attendances[0] || null, // there can only be one per day due to @@unique
    }));

    return NextResponse.json({ attendances: formatted });
  } catch (error) {
    console.error('Fetch transaction attendance error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
