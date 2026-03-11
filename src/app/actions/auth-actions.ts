
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

    // Intentamos decodificar por si el navegador o el proxy la codificó
    const decodedValue = decodeURIComponent(sessionCookie.value);
    const session = JSON.parse(decodedValue) as DriverSession;
    
    if (!session.id || session.role !== 'DELIVERY') {
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error al obtener sesión:', error);
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

  let userToAuth = null;

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

    userToAuth = {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email
    };

    const cookieStore = await cookies();
    
    // Configuración robusta para entornos Cloud / HTTPS
    cookieStore.set('driver_session', JSON.stringify(userToAuth), { 
      httpOnly: true, 
      secure: true, // Forzamos true ya que el entorno es HTTPS
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/'
    });

  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Error de conexión con el servidor.' };
  }

  // Redirección fuera del bloque try-catch
  if (userToAuth) {
    redirect('/splash');
  }
  
  return null;
}

/**
 * Cierra la sesión del repartidor eliminando la cookie.
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('driver_session');
  redirect('/login');
}
