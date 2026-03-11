
"use client";

import { useEffect, useState, useTransition } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Navigation,
  CheckCircle2,
  User,
  Store,
  FileText,
  AlertTriangle,
  Home
} from 'lucide-react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { reportFailedDelivery } from '@/app/actions/order-actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

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
  const [isCustomFail, setIsCustomFail] = useState(false);

  const incidentResponses = [
    "No se encontraba en casa",
    "Dirección equivocada"
  ];

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo cargar la información del pedido."
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrder();
  }, [id, toast]);

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
        title: "Motivo requerido",
        description: "Selecciona el motivo por el cual no se pudo realizar la entrega."
      });
      return;
    }

    startTransition(async () => {
      const res = await reportFailedDelivery(parseInt(id as string), failComment);
      if (res.success) {
        toast({
          title: "Incidencia Reportada",
          description: "Se ha guardado la nota de incidencia."
        });
        setShowFailDialog(false);
        setOrder((prev: any) => ({ ...prev, deliveryNotes: failComment }));
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo procesar el reporte."
        });
      }
    });
  };

  const goToDashboard = () => {
    router.push(`/dashboard?driverId=${driverIdStr}`);
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 font-bold text-slate-400 uppercase tracking-widest text-xs">Cargando pedido...</p>
    </div>
  );

  if (!order) return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen">
      <AlertTriangle className="size-12 text-red-500 mb-4" />
      <h2 className="text-xl font-black">Pedido no encontrado</h2>
      <Button asChild className="mt-6 rounded-xl bg-primary" onClick={goToDashboard}>
        <span>Regresar al Inicio</span>
      </Button>
    </div>
  );

  const senderInfo = order.isGuest 
    ? {
        name: order.guestName || "Invitado",
        email: order.guestEmail || "Sin email",
        phone: order.guestPhone || null
      }
    : {
        name: order.user?.name || "Cliente Registrado",
        email: order.user?.email || "Sin email",
        phone: order.user?.phone || null
      };

  const isDelivered = order.status === 'DELIVERED';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/30">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 border-b border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isDelivered ? (
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={goToDashboard} className="rounded-full text-primary">
              <Home className="w-6 h-6" />
            </Button>
          )}
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Detalle de Orden</h1>
            <p className="text-lg font-black leading-none text-slate-900">#{order.id}</p>
          </div>
        </div>
        <Badge className={`border-none text-[10px] font-black uppercase px-3 py-1 rounded-xl ${
          isDelivered ? 'bg-green-500 text-white' : 
          order.deliveryNotes ? 'bg-amber-500 text-white' : 'bg-primary text-white'
        }`}>
          {isDelivered ? 'Entregado' : order.deliveryNotes ? 'Incidencia' : 'En Ruta'}
        </Badge>
      </header>

      <main className="flex-1 pb-32">
        {!isDelivered && (
          <section className="relative h-60 w-full overflow-hidden mb-6">
            <img 
              src={`https://picsum.photos/seed/${order.id}/800/400`} 
              alt="Mapa" 
              className="w-full h-full object-cover grayscale-[0.2]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50/80 to-transparent"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative flex items-center justify-center">
                <div className="absolute size-16 bg-primary/20 rounded-full animate-ping"></div>
                <div className="size-14 bg-primary rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white">
                  <MapPin className="text-white w-7 h-7" />
                </div>
              </div>
            </div>
            <Button 
              onClick={handleOpenGPS}
              className="absolute bottom-6 right-4 bg-white text-primary hover:bg-slate-50 px-6 py-6 rounded-2xl shadow-2xl border border-slate-100 font-black text-xs uppercase tracking-widest"
            >
              <Navigation className="size-4 mr-2" />
              Abrir GPS
            </Button>
          </section>
        )}

        <div className="px-6 space-y-4">
          {isDelivered && (
            <div className="bg-green-50 p-6 rounded-[2rem] border-2 border-green-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="font-black uppercase tracking-tight text-sm">Entrega Exitosa</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-white/50 p-4 rounded-2xl border border-green-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Recibió</p>
                  <p className="font-bold text-sm text-slate-800">{order.proofOfDeliveryReceiver || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Fecha</p>
                  <p className="font-bold text-[11px] text-slate-800">
                    {order.deliveredAt ? new Date(order.deliveredAt).toLocaleTimeString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {order.deliveryNotes && !isDelivered && (
            <div className="bg-amber-50 p-6 rounded-[2rem] border-2 border-amber-100 space-y-4">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-black uppercase tracking-tight text-sm">Nota de Incidencia</h3>
              </div>
              <p className="text-sm text-amber-800 bg-white/50 p-4 rounded-2xl border border-amber-100 leading-relaxed italic">
                "{order.deliveryNotes}"
              </p>
            </div>
          )}

          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                <Store className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tienda / Remitente</p>
                <h3 className="font-black text-sm text-slate-900">{senderInfo.name}</h3>
                <p className="text-[10px] text-slate-500 font-medium">{senderInfo.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destinatario</p>
                  <h3 className="font-black text-sm text-slate-900">
                    {order.orderAddress?.recipientName || "Cliente"}
                  </h3>
                </div>
              </div>
              {order.orderAddress?.recipientPhone && (
                <Button variant="ghost" size="icon" asChild className="size-12 rounded-2xl bg-primary/10 text-primary">
                  <a href={`tel:${order.orderAddress.recipientPhone}`}>
                    <Phone className="w-5 h-5" />
                  </a>
                </Button>
              )}
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Dirección Completa</p>
              <p className="text-xs font-bold text-slate-600 leading-relaxed">{order.orderAddress?.formattedAddress}</p>
            </div>
          </div>

          <section className="pt-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Artículos ({order.items?.length || 0})
            </h3>
            <div className="space-y-3">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="size-14 relative rounded-2xl overflow-hidden bg-slate-50 shrink-0">
                      <Image 
                        src={item.imageSnap || "https://picsum.photos/seed/product/200/200"} 
                        alt={item.productNameSnap} 
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 leading-tight">{item.productNameSnap}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Ref: {item.id}</p>
                    </div>
                  </div>
                  <span className="font-black text-primary bg-primary/10 px-3 py-1 rounded-lg text-xs">x{item.quantity}</span>
                </div>
              ))}
            </div>
          </section>

          {!isDelivered ? (
            <section className="pt-8 flex flex-col gap-3">
              <Button 
                onClick={() => setShowFailDialog(true)}
                variant="outline" 
                className="w-full border-red-200 text-red-600 bg-red-50/50 h-14 rounded-2xl font-black text-xs uppercase tracking-widest"
              >
                <AlertTriangle className="size-4 mr-2" />
                Reportar Incidencia
              </Button>

              <Button className="w-full bg-primary text-white h-16 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20" asChild>
                <Link href={`/orders/${order.id}/deliver?driverId=${driverIdStr}`}>
                  <CheckCircle2 className="size-5 mr-2" />
                  Confirmar Entrega
                </Link>
              </Button>
            </section>
          ) : (
            <section className="pt-12 pb-8">
              <Button 
                onClick={goToDashboard}
                className="w-full bg-slate-900 text-white h-16 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl"
              >
                <Home className="size-5 mr-2" />
                Volver al Dashboard
              </Button>
            </section>
          )}
        </div>
      </main>

      <Dialog open={showFailDialog} onOpenChange={setShowFailDialog}>
        <DialogContent className="rounded-[2.5rem] border-none p-6 w-[92%] max-w-[400px] bg-white animate-in zoom-in-95 duration-200">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-6" />
              Incidencia
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-500 pt-2 leading-relaxed">
              Confirma que intentaste contactar al cliente y no hubo respuesta tras 10 min de espera.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <p className="text-[10px] text-amber-800 font-black uppercase leading-relaxed">
                Aviso: Se enviará correo notificando que el pedido regresará a tienda.
              </p>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Selecciona el motivo</label>
              <div className="grid grid-cols-1 gap-2">
                {incidentResponses.map((resp) => (
                  <button
                    key={resp}
                    type="button"
                    onClick={() => {
                      setFailComment(resp);
                      setIsCustomFail(false);
                    }}
                    className={cn(
                      "w-full p-4 rounded-2xl text-left text-xs font-bold transition-all border-2",
                      failComment === resp && !isCustomFail
                        ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-200" 
                        : "bg-white border-slate-100 text-slate-600 hover:border-red-200"
                    )}
                  >
                    {resp}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomFail(true);
                    if (incidentResponses.includes(failComment)) setFailComment('');
                  }}
                  className={cn(
                    "w-full p-4 rounded-2xl text-left text-xs font-bold transition-all border-2",
                    isCustomFail
                      ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                      : "bg-white border-slate-100 text-slate-400"
                  )}
                >
                  Otro motivo (Escribir detalle)
                </button>
              </div>

              {isCustomFail && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <Textarea 
                    placeholder="Describe detalladamente el motivo..."
                    className="bg-slate-50 border-none rounded-2xl p-4 text-sm min-h-[100px]"
                    value={failComment}
                    onChange={(e) => setFailComment(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button 
              onClick={handleReportFail}
              disabled={isPending}
              className="w-full bg-red-600 hover:bg-red-700 h-14 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg shadow-red-200"
            >
              {isPending ? "Procesando..." : "Confirmar Reporte"}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowFailDialog(false)}
              className="w-full font-black text-slate-400 text-xs uppercase tracking-widest h-10"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
