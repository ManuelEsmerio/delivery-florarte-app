
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

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_drivemate_2024_secure_min_32_chars';
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
    console.error('DEBUG: JWT Decryption Error:', error);
    return null;
  }
}

export async function getDriverSession(): Promise<DriverSession | null> {
  // En Next.js 15, cookies() ES ASÍNCRONO
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('driver_session')?.value;
  
  if (!sessionToken) {
    console.log('DEBUG: No session token found in cookies. Available cookies:', cookieStore.getAll().map(c => c.name));
    return null;
  }

  const session = await decrypt(sessionToken);
  
  if (!session) {
    console.log('DEBUG: Session decryption failed for token');
    return null;
  }

  if (session.role !== 'DELIVERY') {
    console.log('DEBUG: Role unauthorized:', session.role);
    return null;
  }

  return session;
}

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
      secure: true, // Forzado a true para compatibilidad con Cloud Workstations (HTTPS)
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    console.log('DEBUG: Login successful, cookie set for', email);

  } catch (error) {
    console.error('CRITICAL LOGIN ERROR:', error);
    return { error: 'Error interno del servidor.' };
  }

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
