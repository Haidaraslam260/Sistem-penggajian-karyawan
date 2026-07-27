// Koordinat lokasi kantor pusat (Latitude & Longitude)
export const OFFICE_LATITUDE = parseFloat(process.env.NEXT_PUBLIC_OFFICE_LATITUDE || '-6.394992');
export const OFFICE_LONGITUDE = parseFloat(process.env.NEXT_PUBLIC_OFFICE_LONGITUDE || '106.893437');

// Batas radius absensi yang diizinkan (dalam satuan meter)
export const MAX_RADIUS_METERS = parseFloat(process.env.NEXT_PUBLIC_MAX_RADIUS_METERS || '100');

