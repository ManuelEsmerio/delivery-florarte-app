
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
 * Obtiene la sesión actual del repartidor desde las cookies de forma segura.
 */
export async function getDriverSession(): Promise<DriverSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('driver_session');
    
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const session = JSON.parse(sessionCookie.value) as DriverSession;
    
    // Verificación adicional básica
    if (!session.id || session.role !== 'DELIVERY') {
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

/**
 * Acción de servidor para manejar el inicio de sesión del repartidor.
 */
export async function loginAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Por favor, completa todos los campos.' };
  }

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
      return { error: 'Acceso denegado. Exclusivo para repartidores.' };
    }

    const cookieStore = await cookies();
    
    // Establecemos la cookie antes de redirigir
    cookieStore.set('driver_session', JSON.stringify({
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email
    }), { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/'
    });

  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Error de conexión con el servidor.' };
  }

  // Redirigimos directamente desde el servidor para asegurar que la cookie se procese
  redirect('/splash');
}

/**
 * Cierra la sesión del repartidor eliminando la cookie.
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('driver_session');
  redirect('/login');
}
