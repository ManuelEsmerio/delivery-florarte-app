
"use client";

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, 
  ChevronRight, 
  Package, 
  User, 
  Phone, 
  Clock, 
  Info,
  ExternalLink,
  AlertTriangle,
  Truck
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getOrdersByStatus } from '@/app/actions/order-actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { clearDriverSession, fetchDriverSession, type DriverSession } from '@/lib/driver-session';

export default function DashboardPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'OUT_FOR_DELIVERY' | 'DELIVERED'>('OUT_FOR_DELIVERY');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [currentDateStr] = useState(() => format(new Date(), "EEEE, d 'de' MMMM", { locale: es }));
  const [session, setSession] = useState<DriverSession | null>(null);

  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [quickViewOrder, setQuickViewOrder] = useState<any>(null);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isActive = true;

    const bootstrapSession = async () => {
      const storedSession = await fetchDriverSession();

      if (!isActive) return;

      setIsSessionLoading(false);

      if (!storedSession) {
        router.replace('/login');
        return;
      }

      setSession(storedSession);
      loadOrders('OUT_FOR_DELIVERY');
    };

    bootstrapSession();

    return () => {
      isActive = false;
    };
  }, [router]);

  const loadOrders = (status: 'OUT_FOR_DELIVERY' | 'DELIVERED') => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const data = await getOrdersByStatus(status);
        setOrders(data);
      } catch (error) {
        console.error(error);
        clearDriverSession();
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleMouseEnter = (order: any) => {
    if (hoverTimer) return;
    const timer = setTimeout(() => {
      setQuickViewOrder(order);
    }, 2000);
    setHoverTimer(timer);
  };

  const handleMouseLeave = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
  };

  const handleTouchStart = (order: any) => {
    if (hoverTimer) return;
    const timer = setTimeout(() => {
      setQuickViewOrder(order);
      setHoverTimer(null);
    }, 2000);
    setHoverTimer(timer);
  };

  const handleTouchEnd = () => {
    handleMouseLeave();
  };

  if (isSessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--primary)/0.12),_transparent_55%)]" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/30 animate-bounce">
              <Truck className="w-12 h-12 text-white" />
            </div>
            <div
              className="absolute -inset-4 rounded-[3rem] border-4 border-primary/20 animate-ping opacity-20"
              style={{ animationDuration: '2000ms' }}
            />
          </div>
          <div className="mt-10 text-center space-y-2">
            <h2 className="text-xl font-black text-foreground tracking-tight">Verificando acceso...</h2>
            <p className="text-sm font-medium text-muted-foreground">Autenticando tu identidad</p>
          </div>
          <div className="flex gap-1.5 mt-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex flex-col min-h-full pb-24 bg-background text-foreground transition-colors duration-300">
      <header className="pt-10 px-6 pb-4 bg-background/95 shadow-sm border-b border-border backdrop-blur-md transition-colors duration-300">
        <div className="flex justify-between items-center">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className="text-2xl font-black text-foreground tracking-tight">Mis Entregas</h1>
            <p className="text-[10px] text-primary font-black mt-1 uppercase tracking-widest flex items-center gap-2">
              <Clock className="size-3" />
              {currentDateStr || "Cargando fecha..."}
            </p>
          </div>
          <div className="size-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black border-2 border-primary/20 shadow-inner">
            ID{session.user.id}
          </div>
        </div>
      </header>

      <div className="px-6 py-5 sticky top-0 z-20 bg-background/90 backdrop-blur-md transition-colors duration-300">
        <Tabs value={activeTab} onValueChange={(val: any) => { setActiveTab(val); loadOrders(val); }} className="w-full">
          <TabsList className="w-full bg-card shadow-sm p-1.5 h-14 border border-border rounded-2xl text-muted-foreground transition-colors duration-300">
            <TabsTrigger value="OUT_FOR_DELIVERY" className="flex-1 text-xs font-black uppercase tracking-wider text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all duration-300">
              En Ruta
            </TabsTrigger>
            <TabsTrigger value="DELIVERED" className="flex-1 text-xs font-black uppercase tracking-wider text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all duration-300">
              Entregados
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <main className="flex-1 px-6 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Package className="w-12 h-12 text-muted-foreground/50 mb-4 animate-bounce" />
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Sincronizando ruta...</p>
          </div>
        ) : orders.length > 0 ? (
          orders.map((order, index) => (
            <div 
              key={order.id}
              onMouseEnter={() => handleMouseEnter(order)}
              onMouseLeave={handleMouseLeave}
              onTouchStart={() => handleTouchStart(order)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Link href={`/orders/${order.id}`}>
                <Card className={`rounded-3xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card text-card-foreground overflow-hidden group active:scale-[0.98] ${order.deliveryNotes ? 'ring-2 ring-amber-200 dark:ring-amber-600/50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-md">ID</span>
                          <h2 className="text-lg font-black text-card-foreground">#{order.id}</h2>
                        </div>
                        <p className="text-primary font-bold text-sm">
                          {order.orderAddress?.recipientName || "Cliente"}
                        </p>
                      </div>
                      <Badge className={`text-[9px] font-black uppercase px-3 py-1.5 border-none rounded-xl shadow-sm ${
                        order.status === 'DELIVERED' ? 'bg-green-500 text-white' : 
                        order.deliveryNotes ? 'bg-amber-500 text-white' : 'bg-primary text-white'
                      }`}>
                        {order.status === 'DELIVERED' ? 'Completado' : order.deliveryNotes ? 'Con Incidencia' : 'Pendiente'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-start text-sm text-muted-foreground bg-muted/50 p-3 rounded-2xl border border-border/60 transition-colors duration-300">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary shrink-0" />
                      <span className="line-clamp-2 font-medium leading-relaxed">{order.orderAddress?.formattedAddress || "Sin dirección registrada"}</span>
                    </div>

                    {order.deliveryNotes && (
                      <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-100 dark:border-amber-900/60">
                        <AlertTriangle className="size-3" />
                        <span className="line-clamp-1 italic">{order.deliveryNotes}</span>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-border/70 flex justify-between items-center">
                      <div className="flex -space-x-2">
                        <div className="size-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                          <Package className="size-3" />
                        </div>
                        <div className="size-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                          +
                        </div>
                      </div>
                      <div className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center group-hover:translate-x-1 transition-transform">
                        Ver Detalles
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-card rounded-[2.5rem] border-2 border-dashed border-border flex flex-col items-center animate-in zoom-in duration-500 text-card-foreground transition-colors duration-300">
            <div className="size-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">No hay pedidos registrados</p>
          </div>
        )}
      </main>

      <Dialog open={!!quickViewOrder} onOpenChange={() => setQuickViewOrder(null)}>
        <DialogContent className="!left-4 !right-4 !translate-x-0 !w-auto max-w-[425px] rounded-[2rem] border border-border shadow-2xl p-0 overflow-hidden bg-card text-card-foreground transition-colors duration-300">
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
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Destinatario</p>
              <div className="flex items-center gap-3">
                <div className="size-10 bg-muted rounded-xl flex items-center justify-center">
                  <User className="size-5 text-muted-foreground" />
                </div>
                <p className="text-lg font-bold text-card-foreground">{quickViewOrder?.orderAddress?.recipientName || "No especificado"}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Dirección de Entrega</p>
              <div className="flex items-start gap-3">
                <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="size-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed pt-1">
                  {quickViewOrder?.orderAddress?.formattedAddress}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Contacto Directo</p>
              <div className="flex items-center justify-between bg-muted/50 p-4 rounded-2xl border border-border">
                <div className="flex items-center gap-3">
                  <Phone className="size-5 text-muted-foreground" />
                  <p className="font-bold text-card-foreground">{quickViewOrder?.orderAddress?.recipientPhone || "N/A"}</p>
                </div>
                {quickViewOrder?.orderAddress?.recipientPhone && (
                  <Button variant="outline" size="sm" asChild className="rounded-xl border-primary text-primary hover:bg-primary hover:text-white font-black text-[10px]">
                    <a href={`tel:${quickViewOrder.orderAddress.recipientPhone}`}>Llamar ahora</a>
                  </Button>
                )}
              </div>
            </div>

            <Button className="w-full bg-primary h-14 rounded-2xl font-black text-white shadow-xl shadow-primary/20 group" asChild>
              <Link href={`/orders/${quickViewOrder?.id}`} onClick={() => setQuickViewOrder(null)}>
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
