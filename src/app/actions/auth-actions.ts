
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

// Generamos la clave de firma de forma robusta
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_drivemate_2024_secure_min_32_chars';
  return new TextEncoder().encode(secret);
};

/**
 * Firma un JWT con los datos del repartidor.
 */
async function encrypt(payload: DriverSession) {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

/**
 * Verifica y decodifica el JWT.
 */
async function decrypt(token: string): Promise<DriverSession | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    });
    return payload as DriverSession;
  } catch (error) {
    console.error('JWT Decryption Error:', error);
    return null;
  }
}

/**
 * Obtiene la sesión actual del repartidor verificando el JWT.
 */
export async function getDriverSession(): Promise<DriverSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('driver_session')?.value;
  
  if (!sessionToken) {
    console.log('DEBUG: No session token found in cookies');
    return null;
  }

  const session = await decrypt(sessionToken);
  
  if (!session) {
    console.log('DEBUG: Session decryption failed');
    return null;
  }

  if (session.role !== 'DELIVERY') {
    console.log('DEBUG: Role unauthorized:', session.role);
    return null;
  }

  return session;
}

/**
 * Acción de servidor para el inicio de sesión.
 */
export async function loginAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Por favor, completa todos los campos.' };
  }

  let successToken: string | null = null;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return { error: 'Credenciales inválidas.' };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return { error: 'Credenciales inválidas.' };
    }

    if (user.role !== 'DELIVERY') {
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
    cookieStore.set('driver_session', successToken, { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/'
    });

    console.log('DEBUG: Login successful for', email);

  } catch (error) {
    console.error('CRITICAL LOGIN ERROR:', error);
    return { error: 'Error interno del servidor.' };
  }

  // IMPORTANTE: El redirect debe estar FUERA del bloque try/catch en Next.js
  if (successToken) {
    redirect('/splash');
  }
  
  return null;
}

/**
 * Cierra la sesión del repartidor.
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('driver_session');
  redirect('/login');
}
