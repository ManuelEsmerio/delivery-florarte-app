
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Endpoint para obtener el detalle de una orden específica.
 * Utiliza los modelos User y Order definidos en el esquema.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Retornamos el objeto plano (Next.js se encarga de la serialización JSON)
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error en API de órdenes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
