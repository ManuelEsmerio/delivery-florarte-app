
"use client";

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { SignaturePad } from '@/components/SignaturePad';
import { useToast } from "@/hooks/use-toast";
import { completeDelivery } from '@/app/actions/order-actions';
import { cn } from '@/lib/utils';
import { clearDriverSession, fetchDriverSession, type DriverSession } from '@/lib/driver-session';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function DeliveryConfirmationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [receiverName, setReceiverName] = useState('');
  const [signature, setSignature] = useState('');
  const [observations, setObservations] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [session, setSession] = useState<DriverSession | null>(null);

  useEffect(() => {
    let isActive = true;

    const bootstrapSession = async () => {
      const driverSession = await fetchDriverSession();

      if (!isActive) return;

      if (!driverSession) {
        clearDriverSession();
        router.replace('/login');
        return;
      }

      setSession(driverSession);
    };

    bootstrapSession();

    return () => {
      isActive = false;
    };
  }, [router]);

  const quickResponses = [
    "Recibió la persona",
    "Recibió un familiar",
    "Se entregó con la vecina"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiverName.trim()) {
      toast({
        variant: "destructive",
        title: "Campo requerido",
        description: "El nombre de quien recibe es obligatorio para finalizar la entrega."
      });
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmDelivery = () => {
    setShowConfirmModal(false);
    startTransition(async () => {
      try {
        if (!session) {
          clearDriverSession();
          router.replace('/login');
          return;
        }

        const res = await completeDelivery(
          parseInt(id as string), 
          receiverName, 
          signature,
          observations
        );
        if (res.success) {
          toast({
            title: "¡Entrega Exitosa!",
            description: `El pedido ha sido marcado como entregado.`
          });
          router.replace(`/orders/${id}`);
        } else {
          throw new Error(res.error);
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "No se pudo completar la entrega."
        });
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen animate-in fade-in duration-300 bg-background text-foreground transition-colors duration-300">
      <div className="p-4 bg-background/90 border-b border-border sticky top-0 z-10 flex items-center gap-4 backdrop-blur-md transition-colors duration-300">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/orders/${id}`}>
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </Button>
        <h2 className="font-black text-lg">Confirmar Entrega</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8 flex-1 pb-32">
        <div className="bg-primary/5 p-4 rounded-[2rem] border border-primary/10 flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-1" />
          <div className="text-xs">
            <p className="font-black text-primary uppercase tracking-widest mb-1">Evidencia de Entrega</p>
            <p className="text-primary/70 font-medium">Registra quién recibe el pedido #{id}.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="receiver_name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              Nombre de quien recibe
              <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input 
                id="receiver_name"
                placeholder="Ej. Juan Pérez"
                className="h-14 bg-muted/60 border border-border rounded-2xl pl-12 font-bold text-foreground"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Observaciones de entrega</Label>
            <div className="grid grid-cols-2 gap-2">
              {quickResponses.map((resp) => (
                <button
                  key={resp}
                  type="button"
                  onClick={() => {
                    setObservations(resp);
                    setIsCustom(false);
                  }}
                  className={cn(
                    "p-3 rounded-2xl text-left text-[11px] font-bold transition-all border-2 h-full flex items-center",
                    observations === resp && !isCustom
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-card border-border text-foreground/80 hover:border-primary/20"
                  )}
                >
                  {resp}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setIsCustom(true);
                  if (quickResponses.includes(observations)) setObservations('');
                }}
                className={cn(
                  "p-3 rounded-2xl text-left text-[11px] font-bold transition-all border-2 h-full flex items-center",
                  isCustom
                    ? "bg-foreground border-foreground text-background"
                    : "bg-card border-border text-muted-foreground"
                )}
              >
                Otro (Escribir detalle)
              </button>
            </div>

            {isCustom && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <Textarea 
                  placeholder="Escribe aquí las observaciones adicionales..."
                  className="bg-muted/60 border border-border rounded-2xl p-4 text-sm min-h-[100px] text-foreground"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Firma del Cliente</Label>
            <SignaturePad onCapture={setSignature} />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20"
          disabled={isPending}
        >
          {isPending ? "Procesando..." : (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Finalizar Entrega
            </>
          )}
        </Button>
      </form>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="rounded-[2.5rem] border border-border p-6 w-[92%] max-w-[400px] bg-card text-card-foreground animate-in zoom-in-95 duration-200">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-primary">
              <CheckCircle2 className="size-6" />
              Confirmar Entrega
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-muted-foreground pt-2 leading-relaxed">
              ¿Estás seguro que deseas marcar el pedido #{id} como entregado?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="bg-muted/50 p-4 rounded-2xl border border-border space-y-2">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Recibe</p>
                <p className="font-bold text-sm text-foreground">{receiverName}</p>
              </div>
              {observations && (
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Observación</p>
                  <p className="font-medium text-xs text-foreground/80 italic">{observations}</p>
                </div>
              )}
              {signature && (
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Firma</p>
                  <p className="font-bold text-xs text-green-600">✓ Capturada</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2">
            <Button
              onClick={handleConfirmDelivery}
              disabled={isPending}
              className="w-full h-14 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20"
            >
              {isPending ? "Procesando..." : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Sí, Confirmar Entrega
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowConfirmModal(false)}
              className="w-full h-12 rounded-2xl font-bold text-muted-foreground"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
