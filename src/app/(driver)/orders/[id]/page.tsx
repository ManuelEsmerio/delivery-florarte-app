
import { redirect } from 'next/navigation';
import { requireAuthenticatedDriverFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OrderDetailClient from './OrderDetailClient';

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  let driver: Awaited<ReturnType<typeof requireAuthenticatedDriverFromCookies>>;
  try {
    driver = await requireAuthenticatedDriverFromCookies();
  } catch {
    redirect('/login');
    return null;
  }

  const orderId = parseInt(id);
  if (isNaN(orderId)) redirect('/dashboard');

  const order = await prisma.order.findFirst({
    where: { id: orderId, deliveryDriverId: driver.driverId },
    include: {
      orderAddress: true,
      items: true,
      user: { select: { name: true, email: true } },
    },
  });

  return <OrderDetailClient order={order} orderId={orderId} />;
}
