
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Actualiza el estado de una orden sin validaciones estrictas de sesión.
 */
export async function updateOrderStatus(orderId: number, status: any) {
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
 * Finaliza la entrega con firma, nombre del receptor y observaciones.
 */
export async function completeDelivery(
  orderId: number, 
  receiverName: string, 
  signatureUrl: string,
  observations?: string
) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date(),
      signature: signatureUrl,
      receiverName: receiverName,
      observations: observations
    }
  });

  revalidatePath('/dashboard');
  revalidatePath(`/orders/${orderId}`);
}
