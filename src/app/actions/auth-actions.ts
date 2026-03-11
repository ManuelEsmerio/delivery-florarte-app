
'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as jose from 'jose';

export type ActionState = {
  error?: string;
  success?: boolean;
} | null;

export type DriverSession = {
  id: number;
  name: string;
  role: string;
  email: string;
};

// Generamos el secreto para JWT asegurando que sea estable
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_drivemate_2024_secure_min_32_chars';
  if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET no está definida en .env, usando fallback (no recomendado para producción)');
  }
  return new TextEncoder().encode(secret);
};

async function encrypt(payload: DriverSession) {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

async function decrypt(token: string): Promise<DriverSession | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    });
    return payload as DriverSession;
  } catch (error) {
    console.error('DEBUG: Error al verificar JWT:', error instanceof Error ? error.message : 'Error desconocido');
    return null;
  }
}

/**
 * Obtiene la sesión actual del repartidor.
 */
export async function getDriverSession(): Promise<DriverSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('driver_session')?.value;
  
  // LOG DE DIAGNÓSTICO
  const allCookies = cookieStore.getAll().map(c => c.name);
  console.log('DEBUG [getDriverSession]: Cookies detectadas:', allCookies);

  if (!sessionToken) {
    console.log('DEBUG [getDriverSession]: No se encontró el token "driver_session"');
    return null;
  }

  const session = await decrypt(sessionToken);
  
  if (!session) {
    console.log('DEBUG [getDriverSession]: Token inválido o expirado');
    return null;
  }

  if (session.role !== 'DELIVERY') {
    console.log('DEBUG [getDriverSession]: Rol no autorizado:', session.role);
    return null;
  }

  return session;
}

/**
 * Acción de inicio de sesión.
 */
export async function loginAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Por favor, completa todos los campos.' };
  }

  let successToken: string | null = null;

  try {
    console.log('DEBUG [loginAction]: Intentando login para:', email);
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('DEBUG [loginAction]: Usuario no encontrado');
      return { error: 'Credenciales inválidas.' };
    }

    if (!user.passwordHash) {
      console.log('DEBUG [loginAction]: El usuario no tiene passwordHash configurado');
      return { error: 'Credenciales inválidas.' };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      console.log('DEBUG [loginAction]: Contraseña incorrecta');
      return { error: 'Credenciales inválidas.' };
    }

    if (user.role !== 'DELIVERY') {
      console.log('DEBUG [loginAction]: Rol incorrecto:', user.role);
      return { error: 'Acceso exclusivo para repartidores.' };
    }

    const sessionData: DriverSession = {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email
    };

    successToken = await encrypt(sessionData);
    const cookieStore = await cookies();
    
    // Configuración robusta de la cookie
    cookieStore.set('driver_session', successToken, { 
      httpOnly: true, 
      secure: true, // Siempre true para entornos HTTPS/Cloud
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/'
    });

    console.log('DEBUG [loginAction]: Login exitoso, cookie establecida para', email);

  } catch (error) {
    console.error('CRITICAL LOGIN ERROR:', error);
    return { error: 'Error interno del servidor.' };
  }

  // Redirección fuera del bloque try/catch para evitar interferencias de Next.js
  if (successToken) {
    redirect('/splash');
  }
  
  return null;
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('driver_session');
  redirect('/login');
}
