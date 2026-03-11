
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
    console.error("Error al parsear la sesión");
    redirect('/login');
  }
}

/**
 * Acción de inicio de sesión validando contra la base de datos.
 * IMPORTANTE: Si obtienes error de "Table User does not exist", 
 * verifica que tu modelo User en el schema tenga @@map("users") o el nombre exacto de tu tabla.
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

    if (!user) {
      return { error: "Credenciales inválidas." };
    }

    // Validación de contraseña con bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    
    // Fallback temporal por si aún tienes contraseñas en texto plano (remover en producción)
    const isPlainMatch = password === user.password;

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
      maxAge: 60 * 60 * 24 * 7, // 1 semana
    });

    return redirect('/splash');
  } catch (error) {
    if ((error as any).digest?.includes('NEXT_REDIRECT')) throw error;
    console.error('ERROR en loginAction:', error);
    return { error: "Error de conexión con la base de datos. Verifica los nombres de las tablas." };
  }
}

/**
 * Actualiza la contraseña del usuario actual usando bcrypt.
 */
export async function updatePasswordAction(formData: FormData): Promise<ActionState> {
  const oldPassword = formData.get('oldPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  
  try {
    const session = await getDriverSession();
    
    const user = await prisma.user.findUnique({
      where: { id: session.id }
    });

    if (!user || !user.password) {
      return { error: "Usuario no encontrado." };
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    const isPlainMatch = oldPassword === user.password;

    if (!isMatch && !isPlainMatch) {
      return { error: "La contraseña actual es incorrecta." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar contraseña:", error);
    return { error: "No se pudo actualizar la contraseña." };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('driver_session');
  redirect('/login');
}
