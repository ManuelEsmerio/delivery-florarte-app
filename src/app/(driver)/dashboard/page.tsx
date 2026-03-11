"use client";

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, 
  ChevronRight, 
  Package, 
  User, 
  Phone, 
  Clock, 
  Info,
  ExternalLink
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getOrdersByStatus } from '@/app/actions/order-actions';
import { useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const driverIdStr = searchParams.get('driverId');
  const driverId = driverIdStr ? parseInt(driverIdStr) : null;

  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'OUT_FOR_DELIVERY' | 'DELIVERED'>('OUT_FOR_DELIVERY');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [currentDateStr, setCurrentDateStr] = useState<string>('');

  // Estado para la modal de vista rápida
  const [quickViewOrder, setQuickViewOrder] = useState<any>(null);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

  // Solución para error de hidratación de fecha
  useEffect(() => {
    setCurrentDateStr(format(new Date(), "EEEE, d 'de' MMMM", { locale: es }));
  }, []);

  useEffect(() => {
    if (driverId) {
      loadOrders(activeTab);
    }
  }, [driverId, activeTab]);

  const loadOrders = (status: 'OUT_FOR_DELIVERY' | 'DELIVERED') => {
    setIsLoading(true);
    startTransition(async () => {
      const data = await getOrdersByStatus(driverId!, status);
      setOrders(data);
      setIsLoading(false);
    });
  };

  const handleMouseEnter = (order: any) => {
    // Si ya hay un timer, no crear otro
    if (hoverTimer) return;
    
    const timer = setTimeout(() => {
      setQuickViewOrder(order);
    }, 3000);
    setHoverTimer(timer);
  };

  const handleMouseLeave = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
  };

  if (!driverId) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="size-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
          <User className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Identificación requerida</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-[200px]">Inicia sesión para ver tus órdenes asignadas.</p>
        <Button asChild className="mt-8 bg-primary rounded-xl font-bold px-8 h-12">
          <Link href="/login">Ir al Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-24 bg-slate-50/30">
      <header className="pt-10 px-6 pb-4 bg-white shadow-sm border-b border-slate-100">
        <div className="flex justify-between items-center">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mis Entregas</h1>
            <p className="text-[10px] text-primary font-black mt-1 uppercase tracking-widest flex items-center gap-2">
              <Clock className="size-3" />
              {currentDateStr || "Cargando fecha..."}
            </p>
          </div>
          <div className="size-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black border-2 border-primary/20 shadow-inner">
            ID{driverId}
          </div>
        </div>
      </header>

      <div className="px-6 py-5 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md">
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
          <TabsList className="w-full bg-white shadow-sm p-1.5 h-14 border border-slate-200 rounded-2xl">
            <TabsTrigger value="OUT_FOR_DELIVERY" className="flex-1 text-xs font-black uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all duration-300">
              En Ruta
            </TabsTrigger>
            <TabsTrigger value="DELIVERED" className="flex-1 text-xs font-black uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all duration-300">
              Entregados
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <main className="flex-1 px-6 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Package className="w-12 h-12 text-slate-200 mb-4 animate-bounce" />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sincronizando ruta...</p>
          </div>
        ) : orders.length > 0 ? (
          orders.map((order, index) => (
            <div 
              key={order.id}
              onMouseEnter={() => handleMouseEnter(order)}
              onMouseLeave={handleMouseLeave}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Link href={`/orders/${order.id}?driverId=${driverId}`}>
                <Card className="rounded-3xl border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white overflow-hidden group active:scale-[0.98]">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">ID</span>
                          <h2 className="text-lg font-black text-slate-900">#{order.id}</h2>
                        </div>
                        <p className="text-primary font-bold text-sm">
                          {order.orderAddress?.recipientName || "Cliente"}
                        </p>
                      </div>
                      <Badge className={`text-[9px] font-black uppercase px-3 py-1.5 border-none rounded-xl shadow-sm ${
                        order.status === 'DELIVERED' ? 'bg-green-500 text-white' : 'bg-primary text-white'
                      }`}>
                        {order.status === 'DELIVERED' ? 'Completado' : 'Pendiente'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-start text-sm text-slate-600 bg-slate-50/50 p-3 rounded-2xl">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary shrink-0" />
                      <span className="line-clamp-2 font-medium leading-relaxed">{order.orderAddress?.formattedAddress || "Sin dirección registrada"}</span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                      <div className="flex -space-x-2">
                        {[1, 2].map((i) => (
                          <div key={i} className="size-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                            {i === 1 ? <Package className="size-3" /> : '+'}
                          </div>
                        ))}
                      </div>
                      <div className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center group-hover:translate-x-1 transition-transform">
                        Ver Ruta
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center animate-in zoom-in duration-500">
            <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-slate-200" />
            </div>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No hay pedidos registrados</p>
          </div>
        )}
      </main>

      {/* Modal de Vista Rápida */}
      <Dialog open={!!quickViewOrder} onOpenChange={() => setQuickViewOrder(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white mx-4">
          <div className="bg-primary p-8 text-white relative overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <Info className="size-6" />
                Vista Rápida
              </DialogTitle>
              <DialogDescription className="text-white/70 font-bold uppercase text-[10px] tracking-widest">
                Información clave del pedido #{quickViewOrder?.id}
              </DialogDescription>
            </DialogHeader>
            <ExternalLink className="absolute -bottom-4 -right-4 size-24 text-white/10" />
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destinatario</p>
              <div className="flex items-center gap-3">
                <div className="size-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <User className="size-5 text-slate-600" />
                </div>
                <p className="text-lg font-bold text-slate-900">{quickViewOrder?.orderAddress?.recipientName || "No especificado"}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirección de Entrega</p>
              <div className="flex items-start gap-3">
                <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="size-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-slate-600 leading-relaxed pt-1">
                  {quickViewOrder?.orderAddress?.formattedAddress}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto Directo</p>
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Phone className="size-5 text-slate-400" />
                  <p className="font-bold text-slate-900">{quickViewOrder?.orderAddress?.recipientPhone || "N/A"}</p>
                </div>
                {quickViewOrder?.orderAddress?.recipientPhone && (
                  <Button variant="outline" size="sm" asChild className="rounded-xl border-primary text-primary hover:bg-primary hover:text-white font-black text-[10px]">
                    <a href={`tel:${quickViewOrder.orderAddress.recipientPhone}`}>Llamar ahora</a>
                  </Button>
                )}
              </div>
            </div>

            <Button className="w-full bg-primary h-14 rounded-2xl font-black text-white shadow-xl shadow-primary/20 group" asChild>
              <Link href={`/orders/${quickViewOrder?.id}?driverId=${driverId}`} onClick={() => setQuickViewOrder(null)}>
                Ir al detalle completo
                <ChevronRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
