
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
    console.error('Update Status Error:', error);
    return { success: false, error: 'No se pudo actualizar el estado' };
  }
}

/**
 * Finaliza la entrega y envía correo con Resend.
 * Evita devolver el objeto de la orden completo para prevenir errores de serialización (Decimal).
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
        folder: `deliveries/order_${orderId}`,
        resource_type: 'image',
      });
      finalSignatureUrl = uploadResult.secure_url;
    } catch (error) {
      console.error('Cloudinary Error:', error);
    }
  }

  // 2. Actualizar pedido utilizando los nombres de campos que ya están en tu base de datos
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        // Usamos as any para evitar errores si los campos no están en el modelo local pero sí en la base de datos
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

    // 3. Envío de correo con Resend
    const customerEmail = updatedOrder.isGuest ? (updatedOrder as any).guestEmail : updatedOrder.user?.email;
    const customerName = updatedOrder.isGuest ? ((updatedOrder as any).guestName || 'Cliente') : (updatedOrder.user?.name || 'Cliente');

    if (customerEmail && process.env.RESEND_API_KEY) {
      const itemsHtml = updatedOrder.items.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0;">
            <strong>${(item as any).productNameSnap}</strong>
          </td>
          <td style="padding: 10px 0; text-align: right;">x${item.quantity}</td>
        </tr>
      `).join('');

      await resend.emails.send({
        from: 'DriveMate <entregas@tu-dominio.com>', // Configura tu dominio en Resend
        to: customerEmail,
        subject: `¡Tu pedido #${updatedOrder.id} ha sido entregado!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #ec5b13; padding: 20px; text-align: center; color: white;">
              <h2>¡Entrega Exitosa!</h2>
            </div>
            <div style="padding: 20px;">
              <p>Hola <strong>${customerName}</strong>,</p>
              <p>Tu pedido ha sido entregado correctamente.</p>
              
              <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Pedido:</strong> #${updatedOrder.id}</p>
                <p><strong>Recibido por:</strong> ${receiverName}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                ${observations ? `<p><strong>Notas:</strong> ${observations}</p>` : ''}
              </div>

              <h3>Artículos Entregados</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${itemsHtml}
              </table>

              ${finalSignatureUrl ? `
                <div style="margin-top: 20px; text-align: center;">
                  <p style="font-size: 12px; color: #999;">Firma de recepción:</p>
                  <img src="${finalSignatureUrl}" width="150" style="border: 1px solid #ddd; padding: 5px;" />
                </div>
              ` : ''}
            </div>
          </div>
        `
      });
    }

    revalidatePath('/dashboard');
    revalidatePath(`/orders/${orderId}`);
    // Importante: No devolvemos updatedOrder para evitar el error de Decimal
    return { success: true };
  } catch (error) {
    console.error('Complete Delivery Error:', error);
    return { success: false, error: 'Error al procesar la entrega.' };
  }
}
