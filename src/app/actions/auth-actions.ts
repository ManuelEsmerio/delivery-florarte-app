
'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

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
 * Obtiene la sesión actual del repartidor desde las cookies.
 */
export async function getDriverSession(): Promise<DriverSession | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('driver_session');
  if (!session) return null;
  try {
    return JSON.parse(session.value) as DriverSession;
  } catch {
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
    cookieStore.set('driver_session', JSON.stringify({
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email
    }), { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Error de conexión con la base de datos.' };
  }
}
