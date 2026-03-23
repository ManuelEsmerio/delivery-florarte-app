"use server";

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { requireAuthenticatedDriverFromCookies } from '@/lib/auth';
import {
  createDriverSessionToken,
  DRIVER_SESSION_COOKIE,
  verifyDriverSessionToken,
} from '@/lib/auth-token';
import {
  checkLoginRateLimit,
  clearFailedLoginAttempts,
  getRequestSecurityContext,
  isAllowedDriverEmail,
  recordFailedLoginAttempt,
} from '@/lib/security-audit';

async function writeDriverSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(DRIVER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}

async function clearDriverSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(DRIVER_SESSION_COOKIE);
}

export type ActionState = {
  error?: string;
  success?: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
  };
} | null;

/**
 * Inicio de sesión utilizando passwordHash y cookie httpOnly.
 */
export async function loginAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const requestHeaders = await headers();
  const requestContext = getRequestSecurityContext(requestHeaders, '/login');

  if (!email || !password) {
    return { error: "Por favor, completa todos los campos." };
  }

  const throttle = await checkLoginRateLimit(email, requestContext.ipAddress);
  if (!throttle.allowed) {
    return {
      error: `Acceso temporalmente bloqueado. Intenta de nuevo en ${throttle.retryAfterSeconds} segundos.`,
    };
  }
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(DRIVER_SESSION_COOKIE)?.value;
  const requestHeadersLogout = await headers();
  const requestContextLogout = getRequestSecurityContext(requestHeadersLogout, '/logout');

  if (cookieToken) {
    try {
      const payload = await verifyDriverSessionToken(cookieToken);
      const driverId = Number(payload.driverId || payload.sub);

      if (driverId) {
        await prisma.user.update({
          where: { id: driverId },
          data: {
            tokenVersion: {
              increment: 1,
            },
          },
        });

        // Auditoría desactivada
      }
    } catch (error) {
      console.warn('Logout token ignored:', error);
    }
  }

  await clearDriverSessionCookie();

  return { success: true };
}

/**
 * Actualiza la contraseña utilizando el campo passwordHash.
 */
export async function updatePasswordAction(formData: FormData): Promise<ActionState> {
  const oldPassword = formData.get('oldPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const requestHeadersPassword = await headers();
  const requestContextPassword = getRequestSecurityContext(requestHeadersPassword, '/profile/password');
  
  try {
    const session = await requireAuthenticatedDriverFromCookies();
    const user = await prisma.user.findUnique({
      where: { id: session.driverId }
    });

    if (!user || !user.passwordHash) {
      return { error: "Usuario no encontrado." };
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    const isPlainMatch = oldPassword === user.passwordHash;

    if (!isMatch && !isPlainMatch) {
      return { error: "La contraseña actual es incorrecta." };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedNewPassword,
        tokenVersion: {
          increment: 1,
        },
      }
    });

    await clearDriverSessionCookie();

    // Auditoría desactivada
    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    console.error("Update Password Error:", error);
    return { error: "No se pudo actualizar la contraseña." };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(DRIVER_SESSION_COOKIE)?.value;
  const requestHeadersLogout = await headers();
  const requestContextLogout = getRequestSecurityContext(requestHeadersLogout, '/logout');

  if (cookieToken) {
    try {
      const payload = await verifyDriverSessionToken(cookieToken);
      const driverId = Number(payload.driverId || payload.sub);

      if (driverId) {
        await prisma.user.update({
          where: { id: driverId },
          data: {
            tokenVersion: {
              increment: 1,
            },
          },
        });
      }
    } catch (error) {
      console.warn('Logout token ignored:', error);
    }
  }

  await clearDriverSessionCookie();

  return { success: true };
}
