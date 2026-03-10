"use client";

import { useParams, useRouter } from 'next/navigation';
import { MOCK_ORDERS } from '@/app/lib/mock-data';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from "@/components/ui/button";
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
import { Badge } from '@/components/ui/badge';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const order = MOCK_ORDERS.find(o => o.id === id);

  if (!order) return <div className="p-10 text-center">Pedido no encontrado.</div>;

  return (
    <div className="flex flex-col min-h-screen animate-in fade-in duration-300 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="rounded-full size-10 hover:bg-slate-100">
              <Link href="/dashboard">
                <ArrowLeft className="w-6 h-6" />
              </Link>
            </Button>
            <div>
              <h1 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Orden de Entrega</h1>
              <p className="text-lg font-black leading-none">{order.orderNumber}</p>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </header>

      <main className="flex-1 pb-32">
        {/* Mapa Section */}
        <section className="relative h-64 w-full overflow-hidden">
          <img 
            src={`https://picsum.photos/seed/${order.id}/800/400`} 
            alt="Vista del mapa" 
            className="w-full h-full object-cover grayscale-[0.2]"
            data-ai-hint="map route"
          />
          <div className="absolute inset-0 map-gradient"></div>
          
          {/* Pin Estilizado */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative flex items-center justify-center">
              <div className="absolute size-14 bg-primary/30 rounded-full animate-ping"></div>
              <div className="size-12 bg-primary rounded-full flex items-center justify-center shadow-2xl border-2 border-white">
                <MapPin className="text-white w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Botón GPS flotante */}
          <Button className="absolute bottom-6 right-4 bg-secondary hover:bg-secondary/90 text-white px-6 py-6 rounded-2xl shadow-2xl hover:scale-105 transition-transform">
            <Navigation className="w-5 h-5 mr-2 text-primary fill-primary" />
            <span className="font-bold text-sm">Abrir GPS</span>
          </Button>
        </section>

        {/* Información de Envío */}
        <div className="px-4 -mt-6 space-y-3 relative z-10">
          {order.hasCard && (
            <div className="bg-orange-50 border border-orange-200 p-3 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 duration-500">
              <CreditCard className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold text-primary">ESTE PEDIDO INCLUYE UNA TARJETA</span>
            </div>
          )}

          {/* Remitente */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between card-shadow">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-slate-50 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Remitente</p>
                <h3 className="font-bold text-sm leading-tight">{order.senderName}</h3>
                <p className="text-[10px] text-slate-500">{order.senderPhone}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="size-10 rounded-full bg-slate-50 text-slate-600">
              <Phone className="w-4 h-4" />
            </Button>
          </div>

          {/* Destinatario */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between card-shadow">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Destinatario</p>
                <h3 className="font-bold text-sm leading-tight">{order.customerName}</h3>
                <p className="text-[10px] text-slate-500 line-clamp-1">{order.address}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="size-10 rounded-full bg-primary/10 text-primary">
              <Phone className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Artículos del Pedido */}
        <section className="mt-8 px-4">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Artículos del Pedido</h3>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 card-shadow">
                <div className="flex items-center gap-3">
                  <div className="size-16 relative rounded-xl overflow-hidden bg-slate-50 shrink-0">
                    {item.imageUrl && (
                      <Image 
                        src={item.imageUrl} 
                        alt={item.name} 
                        fill
                        className="object-cover"
                        data-ai-hint="product thumbnail"
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                    <p className="text-[10px] text-slate-500 italic mt-0.5">SKU: ITEM-{Math.floor(Math.random() * 1000)}</p>
                  </div>
                </div>
                <span className="font-black text-slate-900 bg-slate-50 size-8 flex items-center justify-center rounded-lg text-xs">x{item.quantity}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Notas del Cliente */}
        {order.deliveryNotes && (
          <section className="mt-8 px-4">
            <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-2xl">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase text-primary">Nota del Cliente</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                "{order.deliveryNotes}"
              </p>
            </div>
          </section>
        )}

        {/* Acciones Principales */}
        <section className="mt-8 px-4 flex flex-col gap-3">
          {order.status === 'assigned' && (
            <Button className="w-full bg-secondary hover:bg-slate-800 text-white h-16 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl" onClick={() => router.push('/dashboard')}>
              <Map className="w-5 h-5" />
              Iniciar Ruta
            </Button>
          )}
          
          {(order.status === 'in_route' || order.status === 'assigned') && (
            <Button className="w-full bg-primary hover:bg-primary/90 text-white h-16 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20" asChild>
              <Link href={`/orders/${order.id}/deliver`}>
                <CheckCircle2 className="w-5 h-5" />
                Completar Entrega
              </Link>
            </Button>
          )}

          {order.status === 'delivered' && (
            <div className="bg-green-100 text-green-700 h-16 rounded-2xl flex items-center justify-center font-bold gap-2 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-6 h-6" />
              Entrega Completada
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
