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
 * Luego envía un correo de confirmación al cliente.
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
    } catch (error) {
      console.error('ERROR [Cloudinary]: No se pudo subir la firma:', error);
    }
  }

  // 2. Guardar datos en la base de datos
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        proofOfDeliverySignature: finalSignatureUrl,
        proofOfDeliveryReceiver: receiverName,
        deliveryNotes: observations || null
      },
      include: {
        items: true,
        user: true,
        orderAddress: true
      }
    });

    // 3. Enviar correo de confirmación via Resend
    const customerEmail = updatedOrder.isGuest ? updatedOrder.guestEmail : updatedOrder.user?.email;
    const customerName = updatedOrder.isGuest ? updatedOrder.guestName : updatedOrder.user?.name;

    if (customerEmail) {
      const itemsHtml = updatedOrder.items.map(item => `
        <div style="display: flex; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
          <img src="${item.imageSnap || 'https://picsum.photos/seed/product/100/100'}" width="50" height="50" style="border-radius: 8px; margin-right: 15px; object-fit: cover;" />
          <div>
            <p style="margin: 0; font-weight: bold; color: #333;">${item.productNameSnap}</p>
            <p style="margin: 0; font-size: 12px; color: #666;">Cantidad: ${item.quantity}</p>
          </div>
        </div>
      `).join('');

      await resend.emails.send({
        from: 'DriveMate <notificaciones@drivemate.com>', // Asegúrate de configurar tu dominio en Resend
        to: customerEmail,
        subject: `¡Pedido #${updatedOrder.id} entregado con éxito!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ec5b13; margin-bottom: 5px;">¡Tu pedido ha llegado!</h1>
              <p style="color: #666;">Hola ${customerName}, tu entrega se ha completado correctamente.</p>
            </div>

            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
              <h3 style="margin-top: 0; color: #333; border-bottom: 2px solid #ec5b13; display: inline-block;">Detalles de la Entrega</h3>
              <p style="margin: 10px 0; font-size: 14px;"><strong>Número de Orden:</strong> #${updatedOrder.id}</p>
              <p style="margin: 10px 0; font-size: 14px;"><strong>Entregado a:</strong> ${updatedOrder.proofOfDeliveryReceiver}</p>
              <p style="margin: 10px 0; font-size: 14px;"><strong>Fecha y Hora:</strong> ${updatedOrder.deliveredAt?.toLocaleString()}</p>
              ${updatedOrder.deliveryNotes ? `<p style="margin: 10px 0; font-size: 14px;"><strong>Notas del Repartidor:</strong> ${updatedOrder.deliveryNotes}</p>` : ''}
              
              ${finalSignatureUrl ? `
                <div style="margin-top: 20px;">
                  <p style="font-size: 12px; color: #999; margin-bottom: 5px;">Firma de recepción:</p>
                  <img src="${finalSignatureUrl}" width="150" style="border: 1px solid #ddd; padding: 5px; background: white;" />
                </div>
              ` : ''}
            </div>

            <div style="margin-bottom: 30px;">
              <h3 style="color: #333;">Artículos Entregados</h3>
              ${itemsHtml}
            </div>

            <div style="text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #eee; pt: 20px;">
              <p>Gracias por confiar en DriveMate.</p>
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
        `
      });
      console.log(`DEBUG [Resend]: Correo enviado a ${customerEmail}`);
    }

    revalidatePath('/dashboard');
    revalidatePath(`/orders/${orderId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error al completar entrega en DB:', error);
    throw new Error('Error interno al procesar la entrega');
  }
}
