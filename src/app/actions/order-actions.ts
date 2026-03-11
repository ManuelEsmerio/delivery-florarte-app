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
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    throw error;
  }
}

/**
 * Finaliza la entrega guardando la firma en Cloudinary y los datos de recepción.
 */
export async function completeDelivery(
  orderId: number, 
  receiverName: string, 
  signatureBase64?: string,
  observations?: string
) {
  let finalSignatureUrl = null;

  // 1. Si hay firma, subirla a Cloudinary
  // El cliente envía Base64, el servidor lo sube y obtiene la URL
  if (signatureBase64 && signatureBase64.startsWith('data:image')) {
    try {
      const uploadResult = await cloudinary.uploader.upload(signatureBase64, {
        folder: `orders/${orderId}`,
        resource_type: 'image',
        public_id: `signature_${Date.now()}`
      });
      finalSignatureUrl = uploadResult.secure_url;
      console.log(`DEBUG [Cloudinary]: URL generada: ${finalSignatureUrl}`);
    } catch (error) {
      console.error('ERROR [Cloudinary]: No se pudo subir la firma:', error);
    }
  }

  // 2. Guardar SOLO la URL y los textos en la base de datos
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        proofOfDeliverySignature: finalSignatureUrl, // Solo guardamos la URL de Cloudinary
        proofOfDeliveryReceiver: receiverName,
        deliveryNotes: observations || null
      }
    });

    console.log(`DEBUG [Prisma]: Orden ${orderId} actualizada con éxito.`);
    
    revalidatePath('/dashboard');
    revalidatePath(`/orders/${orderId}`);
    
    return updatedOrder;
  } catch (error) {
    console.error('Error al completar entrega en DB:', error);
    throw error;
  }
}
