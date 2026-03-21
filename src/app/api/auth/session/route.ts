import { NextResponse } from 'next/server';
import { requireAuthenticatedDriverFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireAuthenticatedDriverFromCookies();

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        authenticated: false,
        error: error?.message || 'Sesion no valida.',
      },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}