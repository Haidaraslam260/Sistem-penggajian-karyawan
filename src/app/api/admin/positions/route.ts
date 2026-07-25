import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const positions = await db.position.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ positions });
  } catch (error) {
    console.error('Fetch positions error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data jabatan' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, department, basicSalary, positionAllowance } = await request.json();

    if (!name || !department || basicSalary === undefined || positionAllowance === undefined) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi' }, { status: 400 });
    }

    const position = await db.position.create({
      data: {
        name,
        department,
        basicSalary: parseFloat(basicSalary),
        positionAllowance: parseFloat(positionAllowance),
      },
    });

    return NextResponse.json({ success: true, position });
  } catch (error: any) {
    console.error('Create position error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Nama jabatan sudah terdaftar' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, department, basicSalary, positionAllowance } = await request.json();

    if (!id || !name || !department || basicSalary === undefined || positionAllowance === undefined) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi' }, { status: 400 });
    }

    const position = await db.position.update({
      where: { id },
      data: {
        name,
        department,
        basicSalary: parseFloat(basicSalary),
        positionAllowance: parseFloat(positionAllowance),
      },
    });

    return NextResponse.json({ success: true, position });
  } catch (error: any) {
    console.error('Update position error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui jabatan' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID jabatan wajib dicantumkan' }, { status: 400 });
    }

    // Check if any employees belong to this position
    const employeesCount = await db.employee.count({
      where: { positionId: id },
    });

    if (employeesCount > 0) {
      return NextResponse.json({
        error: 'Jabatan tidak dapat dihapus karena masih digunakan oleh beberapa karyawan.'
      }, { status: 400 });
    }

    await db.position.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete position error:', error);
    return NextResponse.json({ error: 'Gagal menghapus jabatan' }, { status: 500 });
  }
}
