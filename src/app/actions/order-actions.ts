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
 * Finaliza la entrega guardando la firma y el nombre del receptor en campos específicos.
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
      // Usamos los campos específicos para comprobante de entrega solicitado
      proofOfDeliverySignature: signatureUrl || null,
      proofOfDeliveryReceiver: receiverName || null
    }
  });

  revalidatePath('/dashboard');
  revalidatePath(`/orders/${orderId}`);
}
