
'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export type ActionState = {
  error?: string;
  success?: boolean;
} | null;

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
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return { error: 'Credenciales inválidas o usuario no encontrado.' };
    }

    // Comparar contraseña con el hash almacenado (bcryptjs)
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return { error: 'Credenciales inválidas.' };
    }

    // Validar que el usuario tenga estrictamente el rol de repartidor
    if (user.role !== 'DELIVERY') {
      return { error: 'Acceso denegado. Esta aplicación es exclusiva para repartidores.' };
    }

    // Establecer una cookie de sesión simple para el prototipo
    const cookieStore = await cookies();
    cookieStore.set('driver_session', JSON.stringify({
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email
    }), { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/'
    });

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Ocurrió un error al conectar con la base de datos.' };
  }
}
