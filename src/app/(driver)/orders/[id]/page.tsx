
"use client";

import { useEffect, useState, useTransition } from 'react';
import { prisma } from '@/lib/prisma';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Navigation,
  CheckCircle2,
  User,
  Store,
  Map,
  CreditCard,
  StickyNote,
  FileText,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { reportFailedDelivery, updateOrderStatus } from '@/app/actions/order-actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';

export default function OrderDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const driverIdStr = searchParams.get('driverId');
  
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showFailDialog, setShowFailDialog] = useState(false);
  const [failComment, setFailComment] = useState('');

  useEffect(() => {
    async function loadOrder() {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
      setIsLoading(false);
    }
    loadOrder();
  }, [id]);

  const handleOpenGPS = () => {
    if (order?.orderAddress?.formattedAddress) {
      const encodedAddress = encodeURIComponent(order.orderAddress.formattedAddress);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
    }
  };

  const handleReportFail = () => {
    if (!failComment.trim()) {
      toast({
        variant: "destructive",
        title: "Comentario requerido",
        description: "Indica el motivo por el cual no se pudo realizar la entrega."
      });
      return;
    }

    startTransition(async () => {
      const res = await reportFailedDelivery(parseInt(id as string), failComment);
      if (res.success) {
        toast({
          title: "Incidencia Reportada",
          description: "Se ha notificado al cliente que el pedido será regresado a la tienda."
        });
        setShowFailDialog(false);
        router.push(`/dashboard?driverId=${driverIdStr}`);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo procesar el reporte."
        });
      }
    });
  };

  if (isLoading) return <div className="p-8 text-center font-bold">Cargando detalles...</div>;
  if (!order) return <div className="p-8 text-center font-bold">Pedido no encontrado.</div>;

  const senderInfo = order.isGuest 
    ? {
        name: order.guestName || "Invitado",
        email: order.guestEmail || "Sin email",
        phone: order.guestPhone || null
      }
    : {
        name: order.user?.name || "Usuario",
        email: order.user?.email || "Sin email",
        phone: order.user?.phone || null
      };

  return (
    <div className="flex flex-col min-h-screen animate-in fade-in duration-300 bg-background">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full size-10">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Orden de Entrega</h1>
              <p className="text-lg font-black leading-none">ORD-{order.id}</p>
            </div>
          </div>
          <Badge className={`border-none text-[10px] font-black tracking-wider uppercase px-3 py-1 ${
            order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
            order.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary'
          }`}>
            {order.status}
          </Badge>
        </div>
      </header>

      <main className="flex-1 pb-32">
        {order.status !== 'DELIVERED' && order.status !== 'FAILED' && (
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

            <Button 
              onClick={handleOpenGPS}
              className="absolute bottom-6 right-4 bg-secondary hover:bg-secondary/90 text-white px-6 py-6 rounded-2xl shadow-2xl"
            >
              <Navigation className="w-5 h-5 mr-2 text-primary fill-primary" />
              <span className="font-bold text-sm">Abrir GPS</span>
            </Button>
          </section>
        )}

        <div className={`px-4 space-y-3 relative z-10 ${order.status !== 'DELIVERED' && order.status !== 'FAILED' ? '-mt-6' : 'mt-6'}`}>
          {order.status === 'DELIVERED' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-green-50 card-shadow space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="font-black uppercase tracking-tight text-sm">Entrega Completada</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Recibido por</p>
                  <p className="font-bold text-sm text-slate-800">{order.proofOfDeliveryReceiver || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Fecha y Hora</p>
                  <p className="font-bold text-[11px] text-slate-800">
                    {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {order.status === 'FAILED' && (
            <div className="bg-red-50 p-6 rounded-2xl shadow-sm border-2 border-red-100 card-shadow space-y-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-black uppercase tracking-tight text-sm">Entrega Fallida</h3>
              </div>
              <p className="text-sm text-red-800 bg-white/50 p-3 rounded-xl border border-red-100">
                <strong>Motivo:</strong> {order.deliveryNotes || "No se pudo contactar al cliente."}
              </p>
            </div>
          )}

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between card-shadow">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-slate-50 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Remitente</p>
                <h3 className="font-bold text-sm leading-tight">{senderInfo.name}</h3>
                <p className="text-[10px] text-slate-500">{senderInfo.email}</p>
              </div>
            </div>
            {senderInfo.phone && (
              <Button variant="ghost" size="icon" asChild className="size-10 rounded-full bg-slate-100 text-slate-600">
                <a href={`tel:${senderInfo.phone}`}>
                  <Phone className="w-4 h-4" />
                </a>
              </Button>
            )}
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
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1 flex items-center gap-2">
            <FileText className="w-3 h-3" />
            Artículos ({order.items?.length || 0})
          </h3>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
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
                  </div>
                </div>
                <span className="font-black text-slate-900 bg-slate-50 size-8 flex items-center justify-center rounded-lg text-xs">x{item.quantity}</span>
              </div>
            ))}
          </div>
        </section>

        {order.status !== 'DELIVERED' && order.status !== 'FAILED' && (
          <section className="mt-8 px-4 flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => setShowFailDialog(true)}
                variant="outline" 
                className="w-full border-red-200 text-red-600 bg-red-50/30 h-14 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-5 h-5" />
                No hay nadie en el domicilio
              </Button>

              <Button className="w-full bg-primary text-white h-16 rounded-2xl font-bold shadow-xl shadow-primary/20" asChild>
                <Link href={`/orders/${order.id}/deliver?driverId=${driverIdStr}`}>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Confirmar Entrega
                </Link>
              </Button>
            </div>
          </section>
        )}
      </main>

      {/* Dialog para Reporte de Fallo */}
      <Dialog open={showFailDialog} onOpenChange={setShowFailDialog}>
        <DialogContent className="rounded-[2rem] border-none p-8 max-w-[90%] mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-6" />
              Reportar Incidencia
            </DialogTitle>
            <DialogDescription className="text-sm font-medium pt-2">
              Confirma que has intentado contactar al cliente y que no hubo respuesta tras 10 minutos de espera.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-800 font-bold leading-relaxed">
                Aviso: Al confirmar, se enviará un correo al cliente indicando que su pedido regresará a la tienda por falta de respuesta.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Comentario del repartidor</label>
              <Textarea 
                placeholder="Ej. Toqué la puerta varias veces y llamé al teléfono pero no contestaron." 
                value={failComment}
                onChange={(e) => setFailComment(e.target.value)}
                className="rounded-xl min-h-[100px] border-slate-200"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 sm:flex-col">
            <Button 
              onClick={handleReportFail}
              disabled={isPending}
              className="w-full bg-red-600 hover:bg-red-700 h-14 rounded-2xl font-bold text-white shadow-lg shadow-red-200"
            >
              {isPending ? "Procesando..." : "Confirmar y Saltar Pedido"}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowFailDialog(false)}
              className="w-full font-bold text-slate-400"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
