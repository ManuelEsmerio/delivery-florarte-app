
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
 * Obtiene la sesión del repartidor de forma segura.
 */
export async function getDriverSession(): Promise<DriverSession> {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get('driver_session')?.value;

  if (!sessionData) {
    redirect('/login');
  }

  try {
    return JSON.parse(sessionData) as DriverSession;
  } catch (e) {
    redirect('/login');
  }
}

/**
 * Inicio de sesión utilizando passwordHash según el esquema.
 */
export async function loginAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: "Por favor, completa todos los campos." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return { error: "Credenciales inválidas." };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    // Soporte temporal para contraseñas en texto plano si existen
    const isPlainMatch = password === user.passwordHash;

    if (!isPasswordValid && !isPlainMatch) {
      return { error: "Credenciales inválidas." };
    }

    const sessionData: DriverSession = {
      id: user.id,
      name: user.name,
      role: user.role || 'DRIVER',
      email: user.email
    };

    const cookieStore = await cookies();
    cookieStore.set('driver_session', JSON.stringify(sessionData), { 
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return redirect('/splash');
  } catch (error) {
    if ((error as any).digest?.includes('NEXT_REDIRECT')) throw error;
    console.error('Login Error:', error);
    return { error: "Error al intentar iniciar sesión. Verifica la conexión." };
  }
}

/**
 * Actualiza la contraseña utilizando el campo passwordHash.
 */
export async function updatePasswordAction(formData: FormData): Promise<ActionState> {
  const oldPassword = formData.get('oldPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  
  try {
    const session = await getDriverSession();
    
    const user = await prisma.user.findUnique({
      where: { id: session.id }
    });

    if (!user || !user.passwordHash) {
      return { error: "Usuario no encontrado." };
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    const isPlainMatch = oldPassword === user.passwordHash;

    if (!isMatch && !isPlainMatch) {
      return { error: "La contraseña actual es incorrecta." };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedNewPassword }
    });

    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    console.error("Update Password Error:", error);
    return { error: "No se pudo actualizar la contraseña." };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('driver_session');
  redirect('/login');
}
