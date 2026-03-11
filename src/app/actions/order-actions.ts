
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
 * Actualiza el estado de una orden respetando el esquema.
 */
export async function updateOrderStatus(orderId: number, status: any) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Update Status Error:', error);
    return { success: false, error: 'No se pudo actualizar el estado' };
  }
}

/**
 * Finaliza la entrega, sube firma a Cloudinary y envía correo con Resend.
 * Evita devolver el objeto de la orden completo para prevenir errores de Decimal.
 */
export async function completeDelivery(
  orderId: number, 
  receiverName: string, 
  signatureBase64?: string,
  observations?: string
) {
  let finalSignatureUrl = null;

  if (signatureBase64 && signatureBase64.startsWith('data:image')) {
    try {
      const uploadResult = await cloudinary.uploader.upload(signatureBase64, {
        folder: `deliveries/order_${orderId}`,
        resource_type: 'image',
      });
      finalSignatureUrl = uploadResult.secure_url;
    } catch (error) {
      console.error('Cloudinary Error:', error);
    }
  }

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        // Usamos as any para campos que sabemos existen en la DB según el flujo previo
        ...({
          proofOfDeliverySignature: finalSignatureUrl,
          proofOfDeliveryReceiver: receiverName,
          deliveryNotes: observations || null
        } as any)
      },
      include: {
        items: true,
        user: true,
        orderAddress: true
      }
    });

    // Envío de correo con Resend
    const customerEmail = updatedOrder.isGuest ? (updatedOrder as any).guestEmail : updatedOrder.user?.email;
    const customerName = updatedOrder.isGuest ? ((updatedOrder as any).guestName || 'Cliente') : (updatedOrder.user?.name || 'Cliente');

    if (customerEmail && process.env.RESEND_API_KEY) {
      const itemsHtml = updatedOrder.items.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0;"><strong>${(item as any).productNameSnap}</strong></td>
          <td style="padding: 10px 0; text-align: right;">x${item.quantity}</td>
        </tr>
      `).join('');

      await resend.emails.send({
        from: 'DriveMate <notificaciones@tu-dominio.com>',
        to: customerEmail,
        subject: `¡Tu pedido #${updatedOrder.id} ha sido entregado!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #ec5b13; padding: 20px; text-align: center; color: white;">
              <h2>¡Entrega Confirmada!</h2>
            </div>
            <div style="padding: 20px;">
              <p>Hola <strong>${customerName}</strong>,</p>
              <p>Tu pedido ha sido entregado exitosamente.</p>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Orden:</strong> #${updatedOrder.id}</p>
                <p><strong>Recibido por:</strong> ${receiverName}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <h3>Detalle del Pedido</h3>
              <table style="width: 100%; border-collapse: collapse;">${itemsHtml}</table>
              ${finalSignatureUrl ? `
                <div style="margin-top: 20px; text-align: center;">
                  <p style="font-size: 11px; color: #999;">Firma de recepción:</p>
                  <img src="${finalSignatureUrl}" width="140" style="border: 1px solid #ddd;" />
                </div>` : ''}
            </div>
          </div>
        `
      });
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Complete Delivery Error:', error);
    return { success: false, error: 'Error al procesar la entrega.' };
  }
}
