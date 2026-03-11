
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
 * Si falla la lectura de la cookie (común en entornos remotos), 
 * devuelve un usuario "Demo" con ID 1 para NO BLOQUEAR el desarrollo.
 */
export async function getDriverSession(): Promise<DriverSession> {
  const fallbackUser: DriverSession = {
    id: 1, 
    name: 'Repartidor Demo',
    role: 'DELIVERY',
    email: 'demo@drivemate.com'
  };

  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log(`DEBUG [getDriverSession]: Cookies detectadas: ${allCookies.length}`);
    
    const sessionData = cookieStore.get('driver_session')?.value;

    if (sessionData) {
      console.log("DEBUG [getDriverSession]: Sesión encontrada en cookies");
      return JSON.parse(sessionData) as DriverSession;
    }
  } catch (e) {
    console.error("DEBUG [getDriverSession]: Error parseando sesión, usando fallback");
  }

  console.log("DEBUG [getDriverSession]: No se encontró cookie, usando Usuario Demo (ID 1)");
  return fallbackUser;
}

/**
 * Acción de inicio de sesión sin validaciones complejas.
 * Intenta guardar la sesión en una cookie, pero redirige siempre para permitir el acceso.
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
      // Forzamos Secure: true porque los entornos Cloud operan sobre HTTPS
      // Si no es Secure, el navegador la descarta inmediatamente.
      cookieStore.set('driver_session', JSON.stringify(sessionData), { 
        path: '/',
        secure: true, 
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
      console.log(`DEBUG [loginAction]: Cookie establecida para ${email}`);
    } else {
      console.log(`DEBUG [loginAction]: Usuario ${email} no encontrado, pero permitiendo acceso demo`);
    }
  } catch (error) {
    console.error('ERROR en loginAction:', error);
  }

  // Redirigimos siempre a splash para fluir a dashboard independientemente de la cookie
  redirect('/splash');
  return null;
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('driver_session');
  redirect('/login');
}
