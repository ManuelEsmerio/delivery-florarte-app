
'use server';

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
    await appendSecurityEvent({
      type: 'login_locked',
      email,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      browser: requestContext.browser,
      route: requestContext.route,
      metadata: {
        retryAfterSeconds: throttle.retryAfterSeconds,
      },
    });
      userAgent: requestContext.userAgent,
      browser: requestContext.browser,
      route: requestContext.route,
    });

    return { error: "Tu correo no pertenece a un dominio autorizado." };
      const failed = await recordFailedLoginAttempt(email, requestContext.ipAddress);
      await appendSecurityEvent({
        type: failed.locked ? 'login_locked' : 'login_failure',
        email,
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
        browser: requestContext.browser,
        route: requestContext.route,
        metadata: {
          reason: 'user_not_found_or_missing_password',
      const failed = await recordFailedLoginAttempt(email, requestContext.ipAddress);
      await appendSecurityEvent({
        type: failed.locked ? 'login_locked' : 'login_failure',
        email,
        driverId: user.id,
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
        browser: requestContext.browser,
        route: requestContext.route,
        metadata: {
        userAgent: requestContext.userAgent,
        browser: requestContext.browser,
        route: requestContext.route,
        metadata: {
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    await writeDriverSessionCookie(token);

    await appendSecurityEvent({
      type: 'login_success',
      email,
      driverId: user.id,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      browser: requestContext.browser,
      route: requestContext.route,
    });
  } catch (error) {
    console.error('Login Error:', error);
    await appendSecurityEvent({
      type: 'login_failure',
      email,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      browser: requestContext.browser,
      route: requestContext.route,
      metadata: {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(DRIVER_SESSION_COOKIE)?.value;
  const requestHeaders = await headers();
  const requestContext = getRequestSecurityContext(requestHeaders, '/logout');

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

        await appendSecurityEvent({
          type: 'logout',
          email: payload.email,
          driverId,
          ipAddress: requestContext.ipAddress,
          userAgent: requestContext.userAgent,
          browser: requestContext.browser,
          route: requestContext.route,
  return { success: true };
}

/**
 * Actualiza la contraseña utilizando el campo passwordHash.
 */
export async function updatePasswordAction(formData: FormData): Promise<ActionState> {
  const oldPassword = formData.get('oldPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const requestHeaders = await headers();
  const requestContext = getRequestSecurityContext(requestHeaders, '/profile/password');
  
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

    await appendSecurityEvent({
      type: 'password_change',
      email: user.email,
      driverId: user.id,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      browser: requestContext.browser,
      route: requestContext.route,
