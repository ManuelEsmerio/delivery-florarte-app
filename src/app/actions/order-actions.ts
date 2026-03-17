
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';
import { Resend } from 'resend';
import { renderOrderStatusUpdateTemplate } from '@/lib/email/order-status-template';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
};

const getMailFrom = () =>
  process.env.RESEND_FROM?.trim() ||
  process.env.EMAIL_FROM?.trim() ||
  'DriveMate <notificaciones@reparto.com>';

const sendEmailOrThrow = async (params: {
  to: string;
  subject: string;
  html: string;
}) => {
  const resend = getResendClient();
  if (!resend) {
    throw new Error('RESEND_API_KEY no esta configurada.');
  }

  const response = await resend.emails.send({
    from: getMailFrom(),
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if ((response as any)?.error) {
    throw new Error((response as any).error.message || 'Resend rechazo el envio del correo.');
  }

  if (!(response as any)?.data?.id) {
    throw new Error('Resend no devolvio id de mensaje.');
  }

  return (response as any).data.id as string;
};

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

    if (customerEmail) {
      try {
        const mailId = await sendEmailOrThrow({
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
        console.info(`[mail] entrega-fallida enviado orderId=${order.id} to=${customerEmail} messageId=${mailId}`);
      } catch (emailErr) {
        console.error('Error enviando email de falla (Resend):', emailErr);
      }
    } else {
      console.warn(`[mail] entrega-fallida omitido: orderId=${order.id} sin email de cliente`);
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

    let emailSent = false;
    let emailError: string | null = null;

    if (customerEmail) {
      try {
        const orderPayload = {
          code: `#${updatedOrder.id}`,
          customerName,
          deliveryDate: updatedOrder.deliveryDate,
          deliveryTimeSlot: updatedOrder.deliveryTimeSlot,
          subtotal: Number(updatedOrder.subtotal),
          couponDiscount: Number(updatedOrder.couponDiscount),
          shippingCost: Number(updatedOrder.shippingCost),
          total: Number(updatedOrder.total),
          address: {
            recipientName: updatedOrder.orderAddress?.recipientName || customerName,
            line1: updatedOrder.orderAddress?.formattedAddress || 'Por confirmar'
          },
          items: updatedOrder.items.map((item) => ({
            name: item.productNameSnap || 'Producto',
            quantity: item.quantity,
            variantName: item.variantNameSnap,
            subtotal: Number(item.unitPrice) * item.quantity,
            imageUrl: item.imageSnap
          }))
        };

        const html = renderOrderStatusUpdateTemplate({
          userName: customerName,
          order: orderPayload,
          newStatus: 'DELIVERED',
          updatedAt: updatedOrder.deliveredAt || updatedOrder.updatedAt || new Date()
        });

        const mailId = await sendEmailOrThrow({
          to: customerEmail,
          subject: `¡Tu pedido #${updatedOrder.id} ha sido entregado!`,
          html,
        });
        emailSent = true;
        console.info(`[mail] entregado enviado orderId=${updatedOrder.id} to=${customerEmail} messageId=${mailId}`);
      } catch (emailErr) {
        console.error('Error enviando email de éxito (Resend):', emailErr);
        emailError = emailErr instanceof Error ? emailErr.message : 'Error desconocido al enviar correo';
      }
    } else {
      emailError = 'La orden no tiene correo de cliente (guestEmail/user.email).';
      console.warn(`[mail] entregado omitido: orderId=${updatedOrder.id} sin email de cliente`);
    }

    revalidatePath('/dashboard');
    if (!emailSent) {
      return {
        success: false,
        error: `La entrega se confirmo, pero no se pudo enviar el correo. ${emailError || ''}`.trim(),
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error en completeDelivery:', error);
    return { success: false, error: error.message || 'Error al procesar la entrega.' };
  }
}
