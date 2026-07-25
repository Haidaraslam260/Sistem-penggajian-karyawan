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

    // Fetch all payslips for the authenticated employee
    const payslips = await db.payslip.findMany({
      where: {
        employeeId: payload.userId,
      },
      include: {
        employee: {
          include: {
            position: true,
          },
        },
      },
      orderBy: {
        period: 'desc', // Show newest payslip first
      },
    });

    return NextResponse.json({ payslips });
  } catch (error) {
    console.error('Fetch employee payslips error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
