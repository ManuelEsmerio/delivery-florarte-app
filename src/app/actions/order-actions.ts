'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Actualiza el estado de una orden.
 * Retorna un objeto serializable para evitar errores de Decimal.
 */
export async function updateOrderStatus(orderId: number, status: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
        deliveredAt: status === 'DELIVERED' ? new Date() : undefined
      }
    });
    revalidatePath('/dashboard');
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    return { success: false, error: 'No se pudo actualizar el estado' };
  }
}

/**
 * Finaliza la entrega guardando la firma en Cloudinary y los datos de recepción.
 * Retorna un objeto plano (serializable) para evitar errores con tipos Decimal de Prisma.
 */
export async function completeDelivery(
  orderId: number, 
  receiverName: string, 
  signatureBase64?: string,
  observations?: string
) {
  let finalSignatureUrl = null;

  // 1. Si hay firma (Base64), subirla a Cloudinary
  if (signatureBase64 && signatureBase64.startsWith('data:image')) {
    try {
      const uploadResult = await cloudinary.uploader.upload(signatureBase64, {
        folder: `orders/${orderId}`,
        resource_type: 'image',
        public_id: `signature_${Date.now()}`
      });
      finalSignatureUrl = uploadResult.secure_url;
      console.log(`DEBUG [Cloudinary]: Firma subida con éxito: ${finalSignatureUrl}`);
    } catch (error) {
      console.error('ERROR [Cloudinary]: No se pudo subir la firma:', error);
      // Continuamos aunque falle la firma, para no bloquear la entrega
    }
  }

  // 2. Guardar datos en la base de datos
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        proofOfDeliverySignature: finalSignatureUrl,
        proofOfDeliveryReceiver: receiverName,
        deliveryNotes: observations || null
      }
    });

    console.log(`DEBUG [Prisma]: Orden ${orderId} marcada como entregada.`);
    
    revalidatePath('/dashboard');
    revalidatePath(`/orders/${orderId}`);
    
    // Retornamos un objeto simple (serializable)
    return { success: true };
  } catch (error) {
    console.error('Error al completar entrega en DB:', error);
    throw new Error('Error interno al procesar la entrega en la base de datos');
  }
}
