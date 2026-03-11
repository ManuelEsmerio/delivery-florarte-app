
import { prisma } from '@/lib/prisma';
import { getDriverSession } from '@/app/actions/auth-actions';
import { redirect, notFound } from 'next/navigation';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Package, 
  StickyNote, 
  Navigation,
  CheckCircle2,
  User,
  Store,
  Map,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getDriverSession();
  if (!session) redirect('/login');

  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) },
    include: {
      orderAddress: true,
      items: true,
      user: true,
    }
  });

  if (!order) notFound();

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      READY_FOR_SHIPMENT: 'Asignado',
      OUT_FOR_DELIVERY: 'En Ruta',
      DELIVERED: 'Entregado',
    };
    return labels[status] || status;
  };

  return (
    <div className="flex flex-col min-h-screen animate-in fade-in duration-300 bg-background">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="rounded-full size-10">
              <Link href="/dashboard">
                <ArrowLeft className="w-6 h-6" />
              </Link>
            </Button>
            <div>
              <h1 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Orden de Entrega</h1>
              <p className="text-lg font-black leading-none">ORD-{order.id}</p>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black tracking-wider uppercase px-3 py-1">
            {getStatusLabel(order.status)}
          </Badge>
        </div>
      </header>

      <main className="flex-1 pb-32">
        <section className="relative h-64 w-full overflow-hidden">
          <img 
            src={`https://picsum.photos/seed/${order.id}/800/400`} 
            alt="Vista del mapa" 
            className="w-full h-full object-cover grayscale-[0.2]"
          />
          <div className="absolute inset-0 map-gradient"></div>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative flex items-center justify-center">
              <div className="absolute size-14 bg-primary/30 rounded-full animate-ping"></div>
              <div className="size-12 bg-primary rounded-full flex items-center justify-center shadow-2xl border-2 border-white">
                <MapPin className="text-white w-6 h-6" />
              </div>
            </div>
          </div>

          <Button className="absolute bottom-6 right-4 bg-secondary hover:bg-secondary/90 text-white px-6 py-6 rounded-2xl shadow-2xl">
            <Navigation className="w-5 h-5 mr-2 text-primary fill-primary" />
            <span className="font-bold text-sm">Abrir GPS</span>
          </Button>
        </section>

        <div className="px-4 -mt-6 space-y-3 relative z-10">
          {order.dedication && (
            <div className="bg-orange-50 border border-orange-200 p-3 rounded-2xl flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold text-primary uppercase">Este pedido incluye una tarjeta con mensaje</span>
            </div>
          )}

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between card-shadow">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-slate-50 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Remitente (Tienda)</p>
                <h3 className="font-bold text-sm leading-tight">Almacén Central</h3>
                <p className="text-[10px] text-slate-500">Logística Interna</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between card-shadow">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Destinatario</p>
                <h3 className="font-bold text-sm leading-tight">
                  {order.orderAddress?.recipientName || "Cliente"}
                </h3>
                <p className="text-[10px] text-slate-500 line-clamp-1">{order.orderAddress?.formattedAddress}</p>
              </div>
            </div>
            {order.orderAddress?.recipientPhone && (
              <Button variant="ghost" size="icon" asChild className="size-10 rounded-full bg-primary/10 text-primary">
                <a href={`tel:${order.orderAddress.recipientPhone}`}>
                  <Phone className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        </div>

        <section className="mt-8 px-4">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Artículos ({order.items.length})</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 card-shadow">
                <div className="flex items-center gap-3">
                  <div className="size-16 relative rounded-xl overflow-hidden bg-slate-50 shrink-0">
                    <Image 
                      src={item.imageSnap || "https://picsum.photos/seed/product/200/200"} 
                      alt={item.productNameSnap} 
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight">{item.productNameSnap}</h4>
                    {item.variantNameSnap && <p className="text-[10px] text-slate-400">{item.variantNameSnap}</p>}
                  </div>
                </div>
                <span className="font-black text-slate-900 bg-slate-50 size-8 flex items-center justify-center rounded-lg text-xs">x{item.quantity}</span>
              </div>
            ))}
          </div>
        </section>

        {order.deliveryNotes && (
          <section className="mt-8 px-4">
            <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-2xl">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase text-primary">Nota de Entrega</span>
              </div>
              <p className="text-sm text-slate-600 italic">"{order.deliveryNotes}"</p>
            </div>
          </section>
        )}

        <section className="mt-8 px-4 flex flex-col gap-3">
          {order.status === 'READY_FOR_SHIPMENT' && (
            <form action={async () => {
              'use server';
              const { updateOrderStatus } = await import('@/app/actions/order-actions');
              await updateOrderStatus(order.id, 'OUT_FOR_DELIVERY');
            }}>
              <Button className="w-full bg-secondary text-white h-16 rounded-2xl font-bold flex items-center justify-center gap-2">
                <Map className="w-5 h-5" />
                Iniciar Ruta
              </Button>
            </form>
          )}
          
          {order.status !== 'DELIVERED' && (
            <Button className="w-full bg-primary text-white h-16 rounded-2xl font-bold" asChild>
              <Link href={`/orders/${order.id}/deliver`}>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Confirmar Entrega
              </Link>
            </Button>
          )}

          {order.status === 'DELIVERED' && (
            <div className="bg-green-100 text-green-700 h-16 rounded-2xl flex items-center justify-center font-bold gap-2">
              <CheckCircle2 className="w-6 h-6" />
              Entrega Completada
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
