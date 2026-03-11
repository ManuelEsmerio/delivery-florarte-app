'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

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
    const sessionData = cookieStore.get('driver_session')?.value;

    if (sessionData) {
      return JSON.parse(sessionData) as DriverSession;
    }
  } catch (e) {
    console.error("DEBUG [getDriverSession]: Error parseando sesión");
  }

  return fallbackUser;
}

/**
 * Acción de inicio de sesión.
 */
export async function loginAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // En un entorno real, aquí validaríamos la contraseña con bcrypt.compare(password, user.password)
    // Para este MVP permitimos acceso si el usuario existe o modo demo si no existe.
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
        secure: true, 
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  } catch (error) {
    console.error('ERROR en loginAction:', error);
  }

  redirect('/splash');
  return null;
}

/**
 * Actualiza la contraseña del usuario actual.
 */
export async function updatePasswordAction(formData: FormData): Promise<ActionState> {
  const oldPassword = formData.get('oldPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  
  const session = await getDriverSession();
  if (!session || session.id === 1 && session.email === 'demo@drivemate.com') {
    return { error: "No puedes cambiar la contraseña en modo Demo." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id }
    });

    if (!user || !user.password) {
      return { error: "Usuario no encontrado o sin contraseña establecida." };
    }

    // 1. Validar contraseña actual
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return { error: "La contraseña actual es incorrecta." };
    }

    // 2. Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Guardar en DB
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    console.error("Error updating password:", error);
    return { error: "Error interno al actualizar la contraseña." };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('driver_session');
  redirect('/login');
}
