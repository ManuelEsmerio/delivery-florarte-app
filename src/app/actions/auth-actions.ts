
'use server';

import { prisma } from '@/lib/prisma';
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
 * Obtiene la sesión del repartidor de forma simple.
 * Si falla, devuelve un usuario "Demo" con ID 1 para no bloquear el desarrollo.
 */
export async function getDriverSession(): Promise<DriverSession> {
  const fallbackUser = {
    id: 1, 
    name: 'Repartidor Demo',
    role: 'DELIVERY',
    email: 'demo@drivemate.com'
  };

  try {
    const cookieStore = await cookies();
    const sessionData = cookieStore.get('driver_session')?.value;

    if (sessionData) {
      // Intentamos parsear el JSON simple
      return JSON.parse(sessionData) as DriverSession;
    }
  } catch (e) {
    console.log("DEBUG: Error leyendo cookie, usando fallback ID 1");
  }

  return fallbackUser;
}

/**
 * Acción de inicio de sesión sin validaciones complejas para facilitar el desarrollo.
 */
export async function loginAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;

  try {
    // Buscamos al usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const sessionData: DriverSession = {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email
      };

      const cookieStore = await cookies();
      cookieStore.set('driver_session', JSON.stringify(sessionData), { 
        path: '/',
        secure: true, // Forzado para entornos HTTPS de nube
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  } catch (error) {
    console.error('ERROR en loginAction:', error);
  }

  // Redirigimos siempre a splash para fluir a dashboard
  redirect('/splash');
  return null;
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('driver_session');
  redirect('/login');
}
