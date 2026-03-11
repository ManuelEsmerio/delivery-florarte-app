'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Actualiza el estado de una orden.
 */
export async function updateOrderStatus(orderId: number, status: string) {
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
 * Finaliza la entrega guardando la firma y el nombre del receptor.
 * Estos campos son opcionales/nullable según el requerimiento.
 */
export async function completeDelivery(
  orderId: number, 
  receiverName?: string, 
  signatureUrl?: string
) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date(),
      signature: signatureUrl || null,
      receiverName: receiverName || null
    }
  });

  revalidatePath('/dashboard');
  revalidatePath(`/orders/${orderId}`);
}
