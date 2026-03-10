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
    <div className="flex flex-col min-h-screen animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="p-4 bg-white border-b sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <Button variant="ghost" size="icon" asChild className="hover:bg-slate-100 transition-colors">
          <Link href="/dashboard">
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </Button>
        <div className="flex flex-col items-center">
          <h2 className="font-bold text-lg leading-none">{order.orderNumber}</h2>
          {order.hasCard && (
            <Badge variant="outline" className="mt-1 border-orange-200 bg-orange-50 text-orange-700 text-[10px] py-0 px-2 flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              INCLUYE TARJETA
            </Badge>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Map Preview Placeholder */}
        <div className="h-48 bg-slate-300 relative overflow-hidden">
          <img 
            src={`https://picsum.photos/seed/${order.id}/800/400`} 
            alt="Vista del mapa" 
            className="w-full h-full object-cover opacity-60 grayscale-[0.5] transition-transform duration-700 hover:scale-105"
            data-ai-hint="map view"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/90 p-3 rounded-full shadow-lg animate-bounce duration-1000">
              <MapPin className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="absolute bottom-4 right-4">
            <Button size="sm" className="bg-white text-primary hover:bg-white shadow-md rounded-full px-4 h-10 transition-transform active:scale-90">
              <Navigation className="w-4 h-4 mr-2" />
              Abrir GPS
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Remitente Info */}
          <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Remitente</p>
                <h3 className="text-xl font-bold">{order.senderName}</h3>
              </div>
              <Button variant="secondary" size="icon" className="rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                <Phone className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <User className="w-5 h-5 text-slate-400 shrink-0" />
                <p className="text-sm font-medium">{order.senderPhone}</p>
              </div>
            </div>
          </section>

          {/* Destinatario Info */}
          <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-150">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Destinatario</p>
                <h3 className="text-xl font-bold">{order.customerName}</h3>
              </div>
              <Button variant="secondary" size="icon" className="rounded-full bg-accent/20 text-accent-foreground hover:bg-accent/30 transition-all">
                <Phone className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm font-medium">{order.address}</p>
              </div>
            </div>
          </section>

          {/* Items List */}
          <section className="bg-white p-5 rounded-2xl shadow-sm animate-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Artículos del Pedido</h3>
            </div>
            <div className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-4 items-center py-2 border-b last:border-none">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                    {item.imageUrl ? (
                      <Image 
                        src={item.imageUrl} 
                        alt={item.name} 
                        fill
                        className="object-cover"
                        data-ai-hint="product image"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">{item.name}</span>
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold transition-all hover:bg-slate-200 text-slate-600">×{item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Notes */}
          {order.deliveryNotes && (
            <section className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl animate-in slide-in-from-bottom-4 duration-500 delay-300">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-primary">Notas del Repartidor</h3>
              </div>
              <p className="text-sm text-blue-900 leading-relaxed italic">
                "{order.deliveryNotes}"
              </p>
            </section>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 pt-0 bg-transparent mb-24 animate-in fade-in duration-500 delay-400">
        {order.status === 'assigned' && (
          <Button 
            className="w-full btn-large bg-primary shadow-lg hover:shadow-xl transition-all"
            onClick={() => router.push(`/dashboard`)}
          >
            Iniciar Ruta
          </Button>
        )}
        {(order.status === 'in_route' || order.status === 'assigned') && (
          <Button 
            className="w-full btn-large bg-accent hover:bg-accent/90 mt-3 shadow-lg hover:shadow-xl transition-all"
            asChild
          >
            <Link href={`/orders/${order.id}/deliver`}>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Completar Entrega
            </Link>
          </Button>
        )}
        {order.status === 'delivered' && (
          <div className="bg-green-100 text-green-700 p-4 rounded-xl text-center font-bold flex items-center justify-center animate-in zoom-in duration-300">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Pedido Completado
          </div>
        )}
      </div>
    </div>
  );
}
