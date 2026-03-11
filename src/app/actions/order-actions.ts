'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';

// Configuración de Cloudinary usando variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
 * Finaliza la entrega guardando la firma en Cloudinary, el nombre del receptor y las observaciones.
 * Se utiliza el campo deliveryNotes para las observaciones finales.
 */
export async function completeDelivery(
  orderId: number, 
  receiverName: string, 
  signatureBase64?: string,
  observations?: string
) {
  let finalSignatureUrl = null;

  // Subir firma a Cloudinary si existe y es un base64 válido
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
      console.error('ERROR [Cloudinary]: Fallo al subir la firma:', error);
    }
  }

  // Actualización en la base de datos usando los campos correctos del esquema
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

  revalidatePath('/dashboard');
  revalidatePath(`/orders/${orderId}`);
}
