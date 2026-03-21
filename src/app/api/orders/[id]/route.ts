
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAuthenticatedDriver } from '@/lib/auth';
import { DRIVER_SESSION_COOKIE, getBearerToken } from '@/lib/auth-token';

/**
 * Endpoint para obtener el detalle de una orden específica.
 * Utiliza los modelos User y Order definidos en el esquema.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = getBearerToken(request.headers.get('authorization')) || cookieStore.get(DRIVER_SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: 'Sesion no valida.' }, { status: 401 });
  }

  let session;

  try {
    session = await requireAuthenticatedDriver(token);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Sesion no valida.' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'ID de orden inválido' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderAddress: true,
        items: true,
        user: true, // Relación con el usuario registrado
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (order.deliveryDriverId !== session.driverId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Retornamos el objeto plano (Next.js se encarga de la serialización JSON)
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error en API de órdenes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
