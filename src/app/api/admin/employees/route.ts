import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const employees = await db.employee.findMany({
      include: {
        position: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Remove password hashes from response
    const sanitizedEmployees = employees.map(({ passwordHash, ...rest }) => rest);

    return NextResponse.json({ employees: sanitizedEmployees });
  } catch (error) {
    console.error('Fetch employees error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data karyawan' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nik,
      name,
      email,
      password,
      role,
      bankAccount,
      photo,
      entryDate,
      gender,
      status,
      positionId,
    } = body;

    // Validation
    if (!nik || !name || !email || !password || !entryDate || !gender || !status || !positionId) {
      return NextResponse.json({ error: 'Kolom NIK, Nama, Email, Password, Tanggal Masuk, Jenis Kelamin, Status, dan Jabatan wajib diisi' }, { status: 400 });
    }

    // Check duplicate NIK
    const existingNik = await db.employee.findUnique({
      where: { nik: nik.trim() },
    });
    if (existingNik) {
      return NextResponse.json({ error: `NIK "${nik.trim()}" sudah digunakan oleh karyawan ${existingNik.name}. NIK harus bersifat unik!` }, { status: 400 });
    }

    // Check duplicate Email
    const existingEmail = await db.employee.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existingEmail) {
      return NextResponse.json({ error: `Email "${email.trim()}" sudah terdaftar pada karyawan ${existingEmail.name}!` }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const employee = await db.employee.create({
      data: {
        nik: nik.trim(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: role || 'employee',
        bankAccount: bankAccount || '-',
        photo: photo || null,
        entryDate: new Date(entryDate),
        gender,
        status,
        positionId,
      },
    });

    const { passwordHash: _, ...sanitized } = employee;
    return NextResponse.json({ success: true, employee: sanitized });
  } catch (error: any) {
    console.error('Create employee error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'NIK atau Email sudah terdaftar di sistem' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      nik,
      name,
      email,
      password,
      role,
      bankAccount,
      photo,
      entryDate,
      gender,
      status,
      positionId,
    } = body;

    if (!id || !nik || !name || !email || !entryDate || !gender || !status || !positionId) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi' }, { status: 400 });
    }

    // Check duplicate NIK (excluding current employee ID)
    const existingNik = await db.employee.findFirst({
      where: {
        nik: nik.trim(),
        NOT: { id },
      },
    });
    if (existingNik) {
      return NextResponse.json({ error: `NIK "${nik.trim()}" sudah digunakan oleh karyawan lain (${existingNik.name}). NIK harus bersifat unik!` }, { status: 400 });
    }

    // Check duplicate Email (excluding current employee ID)
    const existingEmail = await db.employee.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        NOT: { id },
      },
    });
    if (existingEmail) {
      return NextResponse.json({ error: `Email "${email.trim()}" sudah terdaftar pada karyawan lain (${existingEmail.name})!` }, { status: 400 });
    }

    const dataToUpdate: any = {
      nik: nik.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role || 'employee',
      bankAccount: bankAccount || '-',
      photo: photo || null,
      entryDate: new Date(entryDate),
      gender,
      status,
      positionId,
    };

    if (password && password.trim() !== '') {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    const employee = await db.employee.update({
      where: { id },
      data: dataToUpdate,
    });

    const { passwordHash: _, ...sanitized } = employee;
    return NextResponse.json({ success: true, employee: sanitized });
  } catch (error: any) {
    console.error('Update employee error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'NIK atau Email sudah digunakan karyawan lain' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui data karyawan' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID karyawan wajib dicantumkan' }, { status: 400 });
    }

    // Check if employee is deleting themselves
    // In a real app we'd check session, but standard safety: do not allow deleting the seed owner
    const targetEmployee = await db.employee.findUnique({ where: { id } });
    if (targetEmployee?.email === 'owner@perusahaan.com') {
      return NextResponse.json({ error: 'Akun Super Admin utama tidak dapat dihapus' }, { status: 400 });
    }

    await db.employee.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json({ error: 'Gagal menghapus data karyawan' }, { status: 500 });
  }
}
