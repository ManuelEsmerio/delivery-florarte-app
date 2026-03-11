
'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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

/**
 * Codifica el objeto de sesión para evitar problemas de formato en la cookie.
 */
function encodeSession(data: DriverSession): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Decodifica el "token" de la cookie.
 */
function decodeSession(token: string): DriverSession | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    return JSON.parse(decoded) as DriverSession;
  } catch (error) {
    return null;
  }
}

/**
 * Obtiene la sesión actual del repartidor de forma segura.
 */
export async function getDriverSession(): Promise<DriverSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('driver_session');
    
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const session = decodeSession(sessionCookie.value);
    
    if (!session || !session.id || session.role !== 'DELIVERY') {
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error al recuperar sesión:', error);
    return null;
  }
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

  let userToAuth: DriverSession | null = null;

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

    userToAuth = {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email
    };

    const cookieStore = await cookies();
    
    // Establecemos la cookie de sesión "tokenizada"
    cookieStore.set('driver_session', encodeSession(userToAuth), { 
      httpOnly: true, 
      secure: true, // Crucial para entornos HTTPS/Cloud
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/'
    });

  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Error interno del servidor.' };
  }

  // Redireccionamos fuera del try-catch para que Next.js maneje el flujo correctamente
  if (userToAuth) {
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
