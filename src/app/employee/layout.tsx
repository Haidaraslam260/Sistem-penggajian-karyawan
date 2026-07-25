import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';
import EmployeeLayoutClient from '@/components/layout/EmployeeLayoutClient';
import React from 'react';

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = await verifyJWT(token);
  if (!payload || payload.role !== 'employee') {
    redirect('/login');
  }

  const employee = await db.employee.findUnique({
    where: { id: payload.userId },
    include: { position: true },
  });

  if (!employee) {
    redirect('/login');
  }

  return (
    <EmployeeLayoutClient
      employeeName={employee.name}
      positionName={employee.position.name}
      photo={employee.photo || undefined}
    >
      {children}
    </EmployeeLayoutClient>
  );
}
