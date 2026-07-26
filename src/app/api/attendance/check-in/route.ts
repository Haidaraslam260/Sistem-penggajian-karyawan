import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';
import { OFFICE_LATITUDE, OFFICE_LONGITUDE, MAX_RADIUS_METERS } from '@/lib/config';
import { calculateDistance } from '@/lib/geofence';

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

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const attendance = await db.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: payload.userId,
          date: today,
        },
      },
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error('Check-in status GET error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 550 });
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
    if (!payload || payload.role !== 'employee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, latitude, longitude, photo } = await request.json();

    if (!action || !['in', 'out'].includes(action)) {
      return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 });
    }

    // Photo is now optional (camera feature disabled per user choice, GPS-only attendance)

    // Geofencing Validation
    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      return NextResponse.json({ error: 'Akses GPS/Lokasi Anda diperlukan untuk melakukan absensi.' }, { status: 400 });
    }

    const distance = calculateDistance(
      parseFloat(latitude),
      parseFloat(longitude),
      OFFICE_LATITUDE,
      OFFICE_LONGITUDE
    );

    if (distance > MAX_RADIUS_METERS) {
      return NextResponse.json({
        error: `Anda berada di luar radius kantor (${Math.round(distance)} meter dari lokasi kantor). Jarak maksimum yang diizinkan adalah ${MAX_RADIUS_METERS} meter.`
      }, { status: 400 });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const existingAttendance = await db.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: payload.userId,
          date: today,
        },
      },
    });

    const now = new Date();

    if (action === 'in') {
      if (existingAttendance) {
        return NextResponse.json({ error: 'Anda sudah melakukan Clock In hari ini.' }, { status: 400 });
      }

      // Late rule: standard check-in threshold is 09:00 AM local time
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const isLate = hours > 9 || (hours === 9 && minutes > 0);
      const status = isLate ? 'terlambat' : 'hadir';

      const newAttendance = await db.attendance.create({
        data: {
          employeeId: payload.userId,
          date: today,
          clockIn: now,
          latitudeIn: latitude ? parseFloat(latitude) : null,
          longitudeIn: longitude ? parseFloat(longitude) : null,
          status: status,
          photoIn: photo,
        },
      });

      return NextResponse.json({ success: true, attendance: newAttendance });
    } else {
      // action === 'out'
      if (!existingAttendance) {
        return NextResponse.json({ error: 'Anda belum melakukan Clock In hari ini.' }, { status: 400 });
      }

      if (existingAttendance.clockOut) {
        return NextResponse.json({ error: 'Anda sudah melakukan Clock Out hari ini.' }, { status: 400 });
      }

      const updatedAttendance = await db.attendance.update({
        where: {
          id: existingAttendance.id,
        },
        data: {
          clockOut: now,
          latitudeOut: latitude ? parseFloat(latitude) : null,
          longitudeOut: longitude ? parseFloat(longitude) : null,
          photoOut: photo,
        },
      });

      return NextResponse.json({ success: true, attendance: updatedAttendance });
    }
  } catch (error: any) {
    console.error('Check-in POST error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
