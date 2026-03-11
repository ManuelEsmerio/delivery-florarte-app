
'use server';

import { prisma } from '@/lib/prisma';
import { getDriverSession } from './auth-actions';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * Actualiza el estado de una orden.
 */
export async function updateOrderStatus(orderId: number, status: any) {
  await cookies(); // Asegura contexto dinámico
  const session = await getDriverSession();
  if (!session) throw new Error('No autorizado');

  await prisma.order.update({
    where: { id: orderId },
    data: { 
      status,
      deliveredAt: status === 'DELIVERED' ? new Date() : undefined
    }
  });

  revalidatePath('/dashboard');
  revalidatePath(`/orders/${orderId}`);
}

/**
 * Finaliza la entrega con firma y nombre del receptor.
 */
export async function completeDelivery(orderId: number, receiverName: string, signatureUrl: string) {
  await cookies(); // Asegura contexto dinámico
  const session = await getDriverSession();
  if (!session) throw new Error('No autorizado');

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date(),
      signature: signatureUrl,
      deliveryNotes: `Entregado a: ${receiverName}`
    }
  });

  revalidatePath('/dashboard');
}
