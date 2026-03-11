
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
 * Obtiene las órdenes por driverId y status.
 */
export async function getOrdersByStatus(driverId: number, status: 'OUT_FOR_DELIVERY' | 'DELIVERED') {
  try {
    const orders = await prisma.order.findMany({
      where: {
        deliveryDriverId: driverId,
        status: status
      },
      include: {
        orderAddress: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });
    return JSON.parse(JSON.stringify(orders));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

/**
 * Reporta un intento de entrega fallido.
 * Actualiza deliveryNotes y envía correo.
 */
export async function reportFailedDelivery(orderId: number, comment: string) {
  try {
    // 1. Actualizar el deliveryNotes en la base de datos
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryNotes: comment, 
      },
      include: {
        user: true,
      }
    });

    // 2. Intentar enviar correo
    const customerEmail = (order as any).guestEmail || order.user?.email;
    const customerName = (order as any).guestName || order.user?.name || 'Cliente';

    if (customerEmail && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'DriveMate <notificaciones@reparto.com>',
          to: customerEmail,
          subject: `Intento de entrega fallido - Pedido #${order.id}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 20px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #d93025; margin: 0;">Intento de Entrega Fallido</h2>
                <p style="color: #5f6368;">Pedido #${order.id}</p>
              </div>
              <p>Hola <strong>${customerName}</strong>,</p>
              <p>Hemos intentado entregar tu pedido hoy a las ${new Date().toLocaleTimeString()}.</p>
              <div style="background: #fdf2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d93025;">
                <p style="margin: 0; font-weight: bold; color: #d93025;">Nota del repartidor:</p>
                <p style="margin: 5px 0 0 0; font-style: italic; color: #3c4043;">"${comment}"</p>
              </div>
              <div style="background: #fff8e1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f9ab00;">
                <p style="margin: 0; font-size: 14px; color: #3c4043;">
                  <strong>Aviso importante:</strong> El repartidor tuvo 10 min llamando a la puerta pero no recibió respuesta y tu producto será regresado a la tienda.
                </p>
              </div>
              <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                Si tienes dudas, por favor contacta con nuestro equipo de soporte.
              </p>
            </div>
          `
        });
      } catch (emailErr) {
        console.error('Error enviando email de falla (Resend):', emailErr);
      }
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error en reportFailedDelivery:', error);
    return { success: false, error: 'No se pudo reportar la incidencia en la base de datos.' };
  }
}

/**
 * Finaliza la entrega, sube firma y envía correo.
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
        status: 'DELIVERED' as any,
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

    const customerEmail = (updatedOrder as any).guestEmail || updatedOrder.user?.email;
    const customerName = (updatedOrder as any).guestName || updatedOrder.user?.name || 'Cliente';

    if (customerEmail && process.env.RESEND_API_KEY) {
      try {
        const itemsHtml = updatedOrder.items.map(item => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0;"><strong>${(item as any).productNameSnap || 'Producto'}</strong></td>
            <td style="padding: 10px 0; text-align: right;">x${item.quantity}</td>
          </tr>
        `).join('');

        await resend.emails.send({
          from: 'DriveMate <notificaciones@reparto.com>',
          to: customerEmail,
          subject: `¡Tu pedido #${updatedOrder.id} ha sido entregado!`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #primary; padding: 20px; text-align: center; color: white;">
                <h2 style="margin: 0;">¡Entrega Confirmada!</h2>
              </div>
              <div style="padding: 20px;">
                <p>Hola <strong>${customerName}</strong>,</p>
                <p>Tu pedido ha sido entregado exitosamente.</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Orden:</strong> #${updatedOrder.id}</p>
                  <p style="margin: 5px 0;"><strong>Recibido por:</strong> ${receiverName}</p>
                  <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                  ${observations ? `<p style="margin: 5px 0;"><strong>Nota:</strong> ${observations}</p>` : ''}
                </div>
                <h3 style="border-bottom: 2px solid #primary; padding-bottom: 5px;">Detalle del Pedido</h3>
                <table style="width: 100%; border-collapse: collapse;">${itemsHtml}</table>
                ${finalSignatureUrl ? `
                  <div style="margin-top: 30px; text-align: center; border-top: 1px dashed #ddd; padding-top: 20px;">
                    <p style="font-size: 11px; color: #999; margin-bottom: 10px;">Firma de recepción:</p>
                    <img src="${finalSignatureUrl}" width="180" style="border: 1px solid #eee; padding: 5px; border-radius: 4px;" />
                  </div>` : ''}
              </div>
              <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 11px; color: #777;">
                Gracias por confiar en DriveMate.
              </div>
            </div>
          `
        });
      } catch (emailErr) {
        console.error('Error enviando email de éxito (Resend):', emailErr);
      }
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error en completeDelivery:', error);
    return { success: false, error: error.message || 'Error al procesar la entrega.' };
  }
}
