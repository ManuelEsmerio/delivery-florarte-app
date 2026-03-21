
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';
import { Resend } from 'resend';
import { requireAuthenticatedDriverFromCookies } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  renderFailedDeliveryAttemptTemplate,
  renderOrderStatusUpdateTemplate,
} from '@/lib/email/order-status-template';
import { appendSecurityEvent, getRequestSecurityContext } from '@/lib/security-audit';

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
export async function getOrdersByStatus(status: 'OUT_FOR_DELIVERY' | 'DELIVERED') {
  const session = await requireAuthenticatedDriverFromCookies();

  const orders = await prisma.order.findMany({
    where: {
      deliveryDriverId: session.driverId,
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
}

async function assertOrderOwnership(orderId: number, driverId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      deliveryDriverId: true,
    },
  });

  if (!order) {
    throw new Error('La orden no existe.');
  }

  if (order.deliveryDriverId !== driverId) {
    throw new Error('No autorizado para operar esta orden.');
  }
}

/**
 * Reporta un intento de entrega fallido.
 * Actualiza deliveryNotes y envía correo.
 */
export async function reportFailedDelivery(orderId: number, comment: string) {
  try {
    const session = await requireAuthenticatedDriverFromCookies();
    const requestHeaders = await headers();
    const requestContext = getRequestSecurityContext(requestHeaders, `/orders/${orderId}/incident`);
    await assertOrderOwnership(orderId, session.driverId);

    // 1. Actualizar el deliveryNotes en la base de datos
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryNotes: comment, 
      },
      include: {
        items: true,
        orderAddress: true,
        user: true,
      }
    });

    // 2. Intentar enviar correo
    const customerEmail = (order as any).guestEmail || order.user?.email;
    const customerName = (order as any).guestName || order.user?.name || 'Cliente';

    if (customerEmail) {
      try {
        const html = renderFailedDeliveryAttemptTemplate({
          userName: customerName,
          order: {
            code: `#${order.id}`,
            customerName,
            deliveryDate: order.deliveryDate,
            deliveryTimeSlot: order.deliveryTimeSlot,
            address: {
              recipientName: order.orderAddress?.recipientName || customerName,
              line1: order.orderAddress?.formattedAddress || 'Por confirmar',
            },
          },
          attemptAt: new Date(),
          driverComment: comment,
        });

        const mailId = await sendEmailOrThrow({
          to: customerEmail,
          subject: `Intento de entrega fallido - Pedido #${order.id}`,
          html,
        });
        console.info(`[mail] entrega-fallida enviado orderId=${order.id} to=${customerEmail} messageId=${mailId}`);
      } catch (emailErr) {
        console.error('Error enviando email de falla (Resend):', emailErr);
      }
    } else {
      console.warn(`[mail] entrega-fallida omitido: orderId=${order.id} sin email de cliente`);
    }

    revalidatePath('/dashboard');

    await appendSecurityEvent({
      type: 'delivery_incident',
      driverId: session.driverId,
      email: session.user.email,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      browser: requestContext.browser,
      route: requestContext.route,
      metadata: {
        orderId,
        comment,
      },
    });

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
  let session;
  const requestHeaders = await headers();
  const requestContext = getRequestSecurityContext(requestHeaders, `/orders/${orderId}/complete`);
  try {
    session = await requireAuthenticatedDriverFromCookies();
    await assertOrderOwnership(orderId, session.driverId);
  } catch (error: any) {
    return { success: false, error: error.message || 'No autorizado.' };
  }

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

    await appendSecurityEvent({
      type: 'delivery_complete',
      driverId: session.driverId,
      email: session.user.email,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      browser: requestContext.browser,
      route: requestContext.route,
      metadata: {
        orderId,
        receiverName,
        hasSignature: Boolean(finalSignatureUrl),
      },
    });

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
