import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public routes
  const isPublicPage = pathname === '/login';
  const isApiRoute = pathname.startsWith('/api');
  const isAuthApi = pathname.startsWith('/api/auth');
  
  // Get token from cookies
  const token = request.cookies.get('auth_token')?.value;
  
  // Verify token
  const payload = token ? await verifyJWT(token) : null;

  // Protect Pages
  if (!payload) {
    // If not authenticated and trying to access app pages (except /login)
    if (!isPublicPage && !isApiRoute && pathname !== '/') {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Redirect root URL '/' to '/login'
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Protect non-auth API routes
    if (isApiRoute && !isAuthApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
  }

  // If already authenticated
  if (isPublicPage || pathname === '/') {
    const dashboardPath = payload.role === 'owner' ? '/admin/dashboard' : '/employee/dashboard';
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  // Guard /admin/* pages and API routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (payload.role !== 'owner') {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/employee/dashboard', request.url));
    }
  }

  // Guard /employee/* pages and API routes (kecuali /api/employee/profile yang bersifat umum untuk profil akun aktif)
  if ((pathname.startsWith('/employee') || pathname.startsWith('/api/employee')) && pathname !== '/api/employee/profile') {
    if (payload.role !== 'employee') {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static image assets (.png, .jpg, .jpeg, .svg, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.webp$).*)',
  ],
};
