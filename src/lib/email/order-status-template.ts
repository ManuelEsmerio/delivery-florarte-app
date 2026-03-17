import { orders_status as OrderStatus } from '@prisma/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface OrderEmailPayload {
  code: string;
  customerName: string;
  deliveryDate: Date | null;
  deliveryTimeSlot: string | null;
  subtotal: number;
  couponDiscount: number;
  shippingCost: number;
  total: number;
  address: {
    recipientName: string;
    line1: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    variantName?: string | null;
    subtotal: number;
    imageUrl?: string | null;
  }>;
}

interface TemplateProps {
  userName: string;
  order: OrderEmailPayload;
  newStatus: OrderStatus;
  updatedAt: Date;
}

const statusDetails: Record<OrderStatus, { title: string; message: string; accent: string; bg: string; icon: string }> = {
  CREATED: {
    title: 'Pedido creado',
    message: 'Tu pedido fue registrado correctamente y esta pendiente de confirmar pago.',
    accent: '#64748b',
    bg: 'rgba(100,116,139,0.12)',
    icon: '◌',
  },
  PENDING_PAYMENT: {
    title: 'Pedido recibido',
    message: 'Estamos validando el pago y preparando tu orden para comenzar la produccion.',
    accent: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
    icon: '$',
  },
  PAID: {
    title: 'Pago confirmado',
    message: 'Tu pago fue confirmado y tu pedido esta listo para pasar a produccion.',
    accent: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    icon: '✓',
  },
  SCHEDULED: {
    title: 'Pedido programado',
    message: 'Tu pedido fue programado para la fecha de entrega seleccionada.',
    accent: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    icon: '▣',
  },
  FLOWERS_PURCHASED: {
    title: 'Flores adquiridas',
    message: 'Ya adquirimos las flores para tu pedido y seguimos con la preparacion.',
    accent: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    icon: '✿',
  },
  PREPARING: {
    title: 'Tu pedido esta en preparacion',
    message: 'Nuestro taller floral esta elaborando tu arreglo. Te avisaremos antes de salir a ruta.',
    accent: '#6366f1',
    bg: 'rgba(99,102,241,0.12)',
    icon: '✺',
  },
  READY_FOR_SHIPMENT: {
    title: 'Listo para envio',
    message: 'Tu arreglo esta listo y en breve se asignara para salida a ruta.',
    accent: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
    icon: '⬢',
  },
  OUT_FOR_DELIVERY: {
    title: 'Tu pedido va en camino',
    message: 'El repartidor salio con tu pedido y se dirige al destino acordado.',
    accent: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
    icon: '➜',
  },
  DELIVERED: {
    title: 'Pedido entregado',
    message: 'Confirmamos que la entrega se realizo con exito. Gracias por confiar en Florarte.',
    accent: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    icon: '✔',
  },
  CANCELLED: {
    title: 'Pedido cancelado',
    message: 'El pedido fue cancelado segun tu solicitud. Si procede un reembolso, lo veras reflejado pronto.',
    accent: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    icon: '✕',
  },
  PAYMENT_FAILED: {
    title: 'Pago no procesado',
    message: 'No pudimos procesar tu pago. Puedes intentarlo de nuevo o contactar a soporte.',
    accent: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    icon: '!',
  },
  EXPIRED: {
    title: 'Pedido expirado',
    message: 'Tu pedido expiro porque no se completo el pago a tiempo. Crea un nuevo pedido cuando lo desees.',
    accent: '#94a3b8',
    bg: 'rgba(148,163,184,0.12)',
    icon: '◴',
  },
};

const formatDateTime = (value: Date) => format(value, "PPP 'a las' p", { locale: es });

const formatDateSafe = (value: Date | null, fallback: string) => {
  if (!value) return fallback;
  try {
    return format(value, "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return fallback;
  }
};

const formatTimeSlotForUI = (value: string) => value.trim();

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://floreriaflorarte.com').replace(/\/$/, '');
const logoUrl = `${siteUrl.replace(/\/$/, '')}/Logo_Flor.png`;

const escapeHtml = (value: string) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const renderOrderStatusUpdateTemplate = ({ userName, order, newStatus, updatedAt }: TemplateProps): string => {
  const details = statusDetails[newStatus];
  if (!details) return '';

  const highlightedItems = order.items?.slice(0, 3) ?? [];
  const extraItemsCount = Math.max((order.items?.length ?? 0) - highlightedItems.length, 0);
  const deliveryDateLabel = formatDateSafe(order.deliveryDate, 'Fecha por confirmar');
  const deliverySlot = order.deliveryTimeSlot ? formatTimeSlotForUI(order.deliveryTimeSlot) : 'Horario por confirmar';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Actualizacion de estado · ${order.code}</title>
  <style>
    body { margin:0; padding:0; background:#eef2f8; font-family:'Segoe UI',Arial,sans-serif; color:#0f172a; }
    .wrapper { padding:32px 12px; }
    .card { max-width:660px; margin:0 auto; background:#ffffff; border-radius:32px; overflow:hidden; box-shadow:0 26px 70px rgba(15,23,42,0.18); }
    .header { text-align:center; padding:34px 24px 20px; background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%); border-bottom:1px solid #edf0f5; }
    .header img { width:128px; height:auto; display:block; margin:0 auto 12px; }
    .order-chip { display:inline-block; padding:7px 18px; border-radius:999px; font-weight:700; font-size:11px; letter-spacing:0.17em; color:#64748b; background:#eef2ff; }
    .hero { text-align:center; padding:28px 32px 8px; }
    .status-icon { width:86px; height:86px; border-radius:24px; margin:0 auto 18px; font-size:36px; font-weight:800; line-height:86px; text-align:center; }
    .status-pill { display:inline-block; padding:7px 18px; border-radius:999px; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; font-weight:700; }
    .content { padding:0 36px 40px; }
    .card-section { margin-top:20px; border:1px solid #edf0f5; border-radius:22px; padding:22px; background:#fcfdff; box-shadow:0 8px 18px rgba(15,23,42,0.05); }
    .card-section h3 { margin:0 0 14px; font-size:13px; letter-spacing:0.3em; color:#98a2b3; text-transform:uppercase; }
    .info-row { display:flex; justify-content:space-between; gap:12px; margin-bottom:12px; }
    .info-row span { font-size:14px; color:#475467; }
    .info-row strong { font-size:15px; color:#0f172a; text-align:right; }
    .products-grid { margin-top:20px; }
    .product-card { border:1px solid #edf0f5; border-radius:20px; padding:14px; background:#ffffff; }
    .product-card + .product-card { margin-top:12px; }
    .product-image { width:74px; height:74px; border-radius:14px; object-fit:cover; background:#f1f5f9; box-shadow:0 6px 14px rgba(15,23,42,0.12); }
    .product-avatar { width:74px; height:74px; border-radius:14px; background:#ffe4ef; color:#ff2d78; font-weight:800; font-size:26px; line-height:74px; text-align:center; }
    .product-name { margin:0; font-weight:700; color:#0f172a; font-size:15px; line-height:1.3; }
    .product-meta { margin:6px 0 0; color:#667085; font-size:13px; }
    .product-price { margin:8px 0 0; color:#ff2d78; font-weight:700; font-size:14px; }
    .totals { margin-top:20px; border-top:1px dashed #e2e2ea; padding-top:14px; text-align:right; }
    .totals p { margin:4px 0; font-size:14px; color:#475467; }
    .totals strong { font-size:22px; color:#ff2d78; }
    .cta { text-align:center; margin-top:32px; }
    .cta a { display:inline-block; background:#ff2d78; color:#ffffff; text-decoration:none; font-weight:700; padding:16px 46px; border-radius:999px; box-shadow:0 18px 32px rgba(255,45,120,0.35); }
    .footer { background:#f7f8fc; padding:24px 18px 32px; text-align:center; color:#98a2b3; font-size:12px; }
    .footer a { color:#b0b0c0; text-decoration:none; margin:0 8px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; font-size:12px; }
    @media (max-width:640px) {
      .wrapper { padding:16px 0; }
      .card { border-radius:20px; }
      .header { padding:24px 16px 16px; }
      .hero { padding:20px 20px 8px; }
      .hero h1 { font-size:22px !important; }
      .status-icon { width:70px; height:70px; line-height:70px; font-size:30px; }
      .content { padding:0 16px 28px; }
      .card-section { padding:16px; }
      .info-row { flex-direction:column; gap:4px; }
      .info-row strong { text-align:left; }
      .product-card { align-items:flex-start; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom:12px;">
              <img src="${logoUrl}" alt="Florarte" width="128" style="display:block;width:128px;height:auto;" />
            </td>
          </tr>
        </table>
        <span class="order-chip">${order.code}</span>
      </div>
      <div class="hero">
        <div class="status-icon" style="background:${details.bg};color:${details.accent};">
          ${escapeHtml(details.icon)}
        </div>
        <div class="status-pill" style="background:${details.bg};color:${details.accent};">${details.title}</div>
        <h1 style="margin:14px 0 6px;font-size:28px;color:#0f172a;">${details.title}</h1>
        <p style="margin:0;color:#475467;">Hola ${escapeHtml(userName)}, ${details.message}</p>
        <p style="margin:6px 0 0;color:#98a2b3;font-size:13px;">Actualizado el ${formatDateTime(updatedAt)}</p>
      </div>
      <div class="content">
        <div class="card-section">
          <h3>Detalles de la orden</h3>
          <div class="info-row">
            <span>Numero de pedido</span>
            <strong>${order.code}</strong>
          </div>
          <div class="info-row">
            <span>Entrega programada</span>
            <strong>${deliveryDateLabel} · ${deliverySlot}</strong>
          </div>
          <div class="info-row">
            <span>Destinatario</span>
            <strong>${escapeHtml(order.address.recipientName || order.customerName)}</strong>
          </div>
          <div class="info-row" style="margin-bottom:0;">
            <span>Direccion</span>
            <strong>${escapeHtml(order.address.line1 || 'Por confirmar')}</strong>
          </div>
        </div>

        <div class="card-section products-grid">
          <h3>Productos</h3>
          ${highlightedItems.length ? highlightedItems.map((item) => `
            <div class="product-card">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="90" style="vertical-align:top;">
                    ${item.imageUrl
                      ? `<img class="product-image" src="${item.imageUrl}" alt="${escapeHtml(item.name)}" />`
                      : `<div class="product-avatar">${escapeHtml(item.name.charAt(0).toUpperCase())}</div>`}
                  </td>
                  <td style="vertical-align:top;text-align:left;">
                    <p class="product-name">${escapeHtml(item.name)}</p>
                    <p class="product-meta">Cantidad: ${item.quantity}${item.variantName ? ` · ${escapeHtml(item.variantName)}` : ''}</p>
                    <p class="product-price">${formatCurrency(item.subtotal)}</p>
                  </td>
                </tr>
              </table>
            </div>
          `).join('') : `
            <div class="product-card">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="90" style="vertical-align:top;"><div class="product-avatar">F</div></td>
                  <td style="vertical-align:top;text-align:left;">
                    <p class="product-name">Tu pedido esta siendo preparado</p>
                    <p class="product-meta">Pronto veras el detalle completo de los productos en tu historial de pedidos.</p>
                  </td>
                </tr>
              </table>
            </div>
          `}
          ${extraItemsCount > 0 ? `<p style="margin:14px 0 0;color:#667085;font-size:13px;">+ ${extraItemsCount} producto(s) adicional(es) en tu pedido.</p>` : ''}
        </div>

        <div class="card-section" style="margin-top:24px; background:#ffffff;">
          <h3>Resumen de pago</h3>
          <div class="info-row"><span>Subtotal</span><strong>${formatCurrency(order.subtotal)}</strong></div>
          ${order.couponDiscount > 0 ? `<div class="info-row"><span>Descuento</span><strong>- ${formatCurrency(order.couponDiscount)}</strong></div>` : ''}
          <div class="info-row"><span>Envio</span><strong>${formatCurrency(order.shippingCost)}</strong></div>
          <div class="totals">
            <p style="margin:0;color:#98a2b3;font-size:13px;">Estado actual: ${details.title}</p>
            <strong>${formatCurrency(order.total)}</strong>
          </div>
        </div>

        <div class="cta">
          <a href="${siteUrl}/orders">Ver seguimiento completo</a>
        </div>
      </div>
      <div class="footer">
        <div style="margin-bottom:12px;">
          <a href="${siteUrl}">Sitio</a>
          <a href="${siteUrl}/privacy">Privacidad</a>
          <a href="${siteUrl}/contacto">Soporte</a>
        </div>
        <p style="margin:0;color:#b0b4c3;font-size:11px;">© ${new Date().getFullYear()} Florarte · Este es un correo automatico.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};
