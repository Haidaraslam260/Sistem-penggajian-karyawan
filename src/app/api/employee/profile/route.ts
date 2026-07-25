import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employee = await db.employee.findUnique({
      where: { id: payload.userId },
      include: { position: true },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: employee.id,
        nik: employee.nik,
        name: employee.name,
        email: employee.email,
        photo: employee.photo,
        gender: employee.gender,
        status: employee.status,
        ptkpStatus: employee.ptkpStatus,
        bankAccount: employee.bankAccount,
        entryDate: employee.entryDate,
        role: employee.role,
        position: {
          name: employee.position.name,
          department: employee.position.department,
          basicSalary: employee.position.basicSalary,
          positionAllowance: employee.position.positionAllowance,
        },
      },
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
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
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employee = await db.employee.findUnique({
      where: { id: payload.userId },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { currentPassword, newPassword, bankAccount, photo, name } = body;

    const updateData: Record<string, any> = {};

    // 1. If name update requested
    if (name && typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
    }

    // 2. If photo update requested
    if (typeof photo === 'string') {
      updateData.photo = photo;
    }

    // 3. If password update requested
    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Kata sandi lama dan baru wajib diisi' }, { status: 400 });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, employee.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Kata sandi saat ini tidak benar' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Kata sandi baru minimal harus 6 karakter' }, { status: 400 });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      updateData.passwordHash = newHash;
    }

    // 4. If bank account update requested
    if (bankAccount && typeof bankAccount === 'string') {
      updateData.bankAccount = bankAccount.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada perubahan yang dikirimkan' }, { status: 400 });
    }

    await db.employee.update({
      where: { id: payload.userId },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Profil & Keamanan berhasil diperbarui!',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
