
'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export type ActionState = {
  error?: string;
  success?: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
  };
} | null;

/**
 * Inicio de sesión utilizando passwordHash y sin cookies para entorno remoto.
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
    
    // Soporte para contraseñas legacy en texto plano si fuera necesario
    const isPlainMatch = password === user.passwordHash;

    if (!isPasswordValid && !isPlainMatch) {
      return { error: "Credenciales inválidas." };
    }

    return { 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };
  } catch (error) {
    console.error('Login Error:', error);
    return { error: "Error al intentar iniciar sesión." };
  }
}

/**
 * Cierre de sesión (limpia estado en servidor si es necesario)
 */
export async function logoutAction() {
  return { success: true };
}

/**
 * Actualiza la contraseña utilizando el campo passwordHash.
 */
export async function updatePasswordAction(driverId: number, formData: FormData): Promise<ActionState> {
  const oldPassword = formData.get('oldPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: driverId }
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
