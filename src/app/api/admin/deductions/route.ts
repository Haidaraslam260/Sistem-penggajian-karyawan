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

    // Get all employees and load their deductions for the period
    const employees = await db.employee.findMany({
      where: {
        role: 'employee',
      },
      include: {
        position: true,
        deductions: {
          where: { period },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const formatted = employees.map((emp) => ({
      id: emp.id,
      nik: emp.nik,
      name: emp.name,
      position: emp.position,
      deduction: emp.deductions[0] || null,
    }));

    return NextResponse.json({ deductions: formatted });
  } catch (error) {
    console.error('Fetch deductions error:', error);
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
    if (!payload || payload.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      employeeId,
      period,
      lateDeduction,
      absentDeduction,
      otherDeduction,
      description,
    } = body;

    if (!employeeId || !period) {
      return NextResponse.json({ error: 'ID Karyawan dan Periode wajib diisi' }, { status: 400 });
    }

    const deduction = await db.deduction.upsert({
      where: {
        employeeId_period: {
          employeeId,
          period,
        },
      },
      update: {
        lateDeduction: parseFloat(lateDeduction || 0),
        absentDeduction: parseFloat(absentDeduction || 0),
        otherDeduction: parseFloat(otherDeduction || 0),
        description: description || null,
      },
      create: {
        employeeId,
        period,
        lateDeduction: parseFloat(lateDeduction || 0),
        absentDeduction: parseFloat(absentDeduction || 0),
        otherDeduction: parseFloat(otherDeduction || 0),
        description: description || null,
      },
    });

    return NextResponse.json({ success: true, deduction });
  } catch (error) {
    console.error('Save deduction error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan potongan gaji' }, { status: 500 });
  }
}
