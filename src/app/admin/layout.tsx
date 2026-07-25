import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';
import AdminLayoutClient from '@/components/layout/AdminLayoutClient';
import React from 'react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = await verifyJWT(token);
  if (!payload || payload.role !== 'owner') {
    redirect('/login');
  }

  const employee = await db.employee.findUnique({
    where: { id: payload.userId },
  });

  if (!employee) {
    redirect('/login');
  }

  return (
    <AdminLayoutClient adminName={employee.name}>
      {children}
    </AdminLayoutClient>
  );
}
