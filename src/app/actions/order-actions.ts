
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';
import { Resend } from 'resend';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuración de Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Actualiza el estado de una orden.
 */
export async function updateOrderStatus(orderId: number, status: any) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status }
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
 * Finaliza la entrega, sube la firma y envía correo al cliente.
 */
export async function completeDelivery(
  orderId: number, 
  receiverName: string, 
  signatureBase64?: string,
  observations?: string
) {
  let finalSignatureUrl = null;

  // 1. Subir firma a Cloudinary si existe
  if (signatureBase64 && signatureBase64.startsWith('data:image')) {
    try {
      const uploadResult = await cloudinary.uploader.upload(signatureBase64, {
        folder: `deliveries/${orderId}`,
        resource_type: 'image',
      });
      finalSignatureUrl = uploadResult.secure_url;
    } catch (error) {
      console.error('Error subiendo firma a Cloudinary:', error);
    }
  }

  // 2. Actualizar pedido en base de datos
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        // Usamos campos dinámicos para evitar errores si el esquema varía ligeramente
        // pero respetando la estructura que el usuario indicó que ya tiene en la DB
        ...( (prisma.order as any).fields?.proofOfDeliverySignature ? { proofOfDeliverySignature: finalSignatureUrl } : {}),
        ...( (prisma.order as any).fields?.proofOfDeliveryReceiver ? { proofOfDeliveryReceiver: receiverName } : {}),
        deliveryNotes: observations || null
      } as any,
      include: {
        items: true,
        user: true,
        orderAddress: true
      }
    });

    // 3. Envío de correo con Resend
    const customerEmail = updatedOrder.isGuest ? updatedOrder.guestEmail : updatedOrder.user?.email;
    const customerName = updatedOrder.isGuest ? (updatedOrder.guestName || 'Cliente') : (updatedOrder.user?.name || 'Cliente');

    if (customerEmail) {
      const itemsHtml = updatedOrder.items.map(item => `
        <li style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px; list-style: none;">
          <div style="display: flex; align-items: center;">
            <img src="${item.imageSnap || 'https://picsum.photos/seed/product/50/50'}" width="50" style="border-radius: 4px; margin-right: 10px;" />
            <div>
              <strong>${item.productNameSnap}</strong><br/>
              <span style="font-size: 12px; color: #666;">Cantidad: ${item.quantity}</span>
            </div>
          </div>
        </li>
      `).join('');

      await resend.emails.send({
        from: 'DriveMate <entregas@tu-dominio.com>',
        to: customerEmail,
        subject: `¡Tu pedido #${updatedOrder.id} ha sido entregado!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h1 style="color: #ec5b13;">¡Hola ${customerName}!</h1>
            <p>Tu pedido ha sido entregado con éxito. Aquí tienes los detalles:</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Orden:</strong> #${updatedOrder.id}</p>
              <p><strong>Recibido por:</strong> ${receiverName}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
              ${observations ? `<p><strong>Notas:</strong> ${observations}</p>` : ''}
            </div>

            <h3>Productos entregados:</h3>
            <ul style="padding: 0;">${itemsHtml}</ul>

            ${finalSignatureUrl ? `
              <div style="margin-top: 20px;">
                <p><strong>Firma de recepción:</strong></p>
                <img src="${finalSignatureUrl}" width="200" style="border: 1px solid #ddd;" />
              </div>
            ` : ''}

            <p style="margin-top: 30px; font-size: 12px; color: #999;">Gracias por confiar en DriveMate.</p>
          </div>
        `
      });
    }

    revalidatePath('/dashboard');
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error('Error al completar la entrega:', error);
    return { success: false, error: 'Error al procesar la entrega en la base de datos.' };
  }
}
