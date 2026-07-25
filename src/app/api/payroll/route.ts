import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';
import { calculatePayrollDeductions } from '@/lib/payrollCalculator';

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

    const payslips = await db.payslip.findMany({
      where: { period },
      include: {
        employee: {
          include: { position: true },
        },
      },
      orderBy: {
        employee: {
          name: 'asc',
        },
      },
    });

    return NextResponse.json({ payslips });
  } catch (error) {
    console.error('Fetch payroll error:', error);
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

    const body = await request.json().catch(() => ({}));
    const period = body.period || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const [yearStr, monthStr] = period.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-indexed

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    // Fetch active employees with position info & attendance for the month
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
    });

    const today = new Date();
    const calculationEnd = (today.getFullYear() === year && today.getMonth() === month)
      ? today
      : endDate;

    const weekdays: string[] = [];
    let curDate = new Date(startDate);
    while (curDate <= calculationEnd) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        weekdays.push(curDate.toISOString().split('T')[0]);
      }
      curDate.setDate(curDate.getDate() + 1);
    }

    const generatedPayslips = [];

    for (const emp of employees) {
      // 1. Basic Salary (Gaji Pokok) & Position Allowance (Tunjangan Jabatan) from Position table
      const basicSalary = emp.position.basicSalary;
      const positionAllowance = emp.position.positionAllowance;

      // 2. Overtime tracker lookup (approved overtime pay)
      const approvedOvertimes = await db.overtime.findMany({
        where: {
          employeeId: emp.id,
          status: 'approved',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      const overtimePay = approvedOvertimes.reduce((sum, ot) => sum + ot.totalPay, 0);
      const totalAllowances = positionAllowance;

      // 3. Attendance Deductions (Keterlambatan / Alpa)
      let attendanceDeductionAmount = 0;
      const customDeduction = await db.deduction.findUnique({
        where: {
          employeeId_period: {
            employeeId: emp.id,
            period,
          },
        },
      });

      if (customDeduction) {
        attendanceDeductionAmount = customDeduction.lateDeduction + customDeduction.absentDeduction + customDeduction.otherDeduction;
      } else {
        // Fallback to auto-calculation from attendances
        const lateCount = emp.attendances.filter(a => a.status === 'terlambat').length;
        const lateDeduction = lateCount * 30000;

        const attendanceDates = emp.attendances.map(a => new Date(a.date).toISOString().split('T')[0]);
        let absentDays = 0;
        for (const dateStr of weekdays) {
          if (!attendanceDates.includes(dateStr)) {
            absentDays++;
          }
        }
        const absentDeduction = absentDays * 150000;
        attendanceDeductionAmount = lateDeduction + absentDeduction;

        // Persist the calculated deduction record in database
        await db.deduction.create({
          data: {
            employeeId: emp.id,
            period,
            lateDeduction,
            absentDeduction,
            otherDeduction: 0,
            description: 'Kalkulasi Otomatis Kehadiran',
          },
        });
      }

      // 4. Calculate BPJS & PPh 21 TER
      const statutory = calculatePayrollDeductions({
        basicSalary,
        positionAllowance,
        overtimePay,
        ptkpStatus: emp.ptkpStatus || 'TK/0',
      });

      const totalDeductions = attendanceDeductionAmount + statutory.bpjsKetenagakerjaan + statutory.bpjsKesehatan + statutory.pph21;

      // 5. Net Salary (Gaji Bersih)
      const netSalary = Math.max(0, basicSalary + totalAllowances + overtimePay - totalDeductions);

      // 6. Upsert Payslip
      const payslip = await db.payslip.upsert({
        where: {
          employeeId_period: {
            employeeId: emp.id,
            period,
          },
        },
        update: {
          basicSalary,
          totalAllowances,
          overtimePay,
          bpjsKetenagakerjaan: statutory.bpjsKetenagakerjaan,
          bpjsKesehatan: statutory.bpjsKesehatan,
          pph21: statutory.pph21,
          totalDeductions,
          netSalary,
        },
        create: {
          employeeId: emp.id,
          period,
          basicSalary,
          totalAllowances,
          overtimePay,
          bpjsKetenagakerjaan: statutory.bpjsKetenagakerjaan,
          bpjsKesehatan: statutory.bpjsKesehatan,
          pph21: statutory.pph21,
          totalDeductions,
          netSalary,
          paymentStatus: 'pending',
        },
      });

      generatedPayslips.push(payslip);
    }

    return NextResponse.json({ success: true, count: generatedPayslips.length });
  } catch (error: any) {
    console.error('Generate payroll error:', error);
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

    const body = await request.json().catch(() => ({}));
    const { payslipId, status } = body;

    if (!payslipId || !status || !['pending', 'paid', 'failed'].includes(status)) {
      return NextResponse.json({ error: 'Data input tidak valid' }, { status: 400 });
    }

    const updatedPayslip = await db.payslip.update({
      where: {
        id: payslipId,
      },
      data: {
        paymentStatus: status,
      },
      include: {
        employee: {
          include: { position: true },
        },
      },
    });

    return NextResponse.json({ success: true, payslip: updatedPayslip });
  } catch (error: any) {
    console.error('Update payment status error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
