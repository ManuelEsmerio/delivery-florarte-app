import 'server-only';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { DRIVER_SESSION_COOKIE, verifyDriverSessionToken } from '@/lib/auth-token';

export async function getDriverTokenFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(DRIVER_SESSION_COOKIE)?.value || '';
}

export async function requireAuthenticatedDriver(token: string) {
  if (!token) {
    throw new Error('Sesion no valida. Inicia sesion nuevamente.');
  }

  const payload = await verifyDriverSessionToken(token);
  const driverId = Number(payload.driverId || payload.sub);

  if (!driverId || payload.role !== 'DELIVERY') {
    throw new Error('No autorizado para acceder al portal de repartidores.');
  }

  const user = await prisma.user.findUnique({
    where: { id: driverId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tokenVersion: true,
      isDeleted: true,
    },
  });

  if (!user || user.isDeleted || user.role !== 'DELIVERY') {
    throw new Error('Sesion invalida o usuario no disponible.');
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    throw new Error('Tu sesion expiro. Inicia sesion nuevamente.');
  }

  return {
    driverId: user.id,
    user,
  };
}

export async function requireAuthenticatedDriverFromCookies() {
  const token = await getDriverTokenFromCookies();
  return requireAuthenticatedDriver(token);
}