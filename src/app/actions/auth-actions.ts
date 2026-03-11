
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
 * Obtiene la sesión del repartidor. 
 * Si no hay cookie, devuelve un usuario por defecto para no bloquear el desarrollo.
 */
export async function getDriverSession(): Promise<DriverSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionData = cookieStore.get('driver_session')?.value;

    if (sessionData) {
      return JSON.parse(sessionData) as DriverSession;
    }
  } catch (e) {
    console.error("Error leyendo sesión, usando fallback");
  }

  // FALLBACK: Usuario por defecto para desarrollo sin bloqueos
  return {
    id: 1, // Asegúrate de que exista un usuario con ID 1 en tu DB o cámbialo por uno válido
    name: 'Repartidor Demo',
    role: 'DELIVERY',
    email: 'demo@drivemate.com'
  };
}

/**
 * Acción de inicio de sesión simplificada (Sin validación de password ni JWT)
 */
export async function loginAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Si el usuario existe, guardamos sus datos en una cookie simple (JSON)
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
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  } catch (error) {
    console.error('Error en login:', error);
  }

  // Redirigimos siempre para no bloquear el flujo
  redirect('/splash');
  return null;
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('driver_session');
  redirect('/login');
}
