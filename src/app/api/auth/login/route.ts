import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signJWT } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find employee
    const employee = await db.employee.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, employee.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    // Generate JWT
    const token = await signJWT({
      userId: employee.id,
      role: employee.role,
      email: employee.email,
    });

    const response = NextResponse.json({
      success: true,
      role: employee.role,
      name: employee.name,
    });

    // Set HTTP-only Cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
