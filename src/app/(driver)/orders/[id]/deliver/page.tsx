
"use client";

import { useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { SignaturePad } from '@/components/SignaturePad';
import { useToast } from "@/hooks/use-toast";
import { completeDelivery } from '@/app/actions/order-actions';

export default function DeliveryConfirmationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [receiverName, setReceiverName] = useState('');
  const [signature, setSignature] = useState('');
  const [observations, setObservations] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) {
      toast({
        variant: "destructive",
        title: "Firma Requerida",
        description: "Por favor, solicita la firma del receptor."
      });
      return;
    }

    startTransition(async () => {
      try {
        await completeDelivery(
          parseInt(id as string), 
          receiverName, 
          signature,
          observations
        );
        toast({
          title: "¡Entrega Exitosa!",
          description: `El pedido ha sido marcado como entregado.`
        });
        router.push(`/orders/${id}`);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo completar la entrega."
        });
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen animate-in fade-in duration-300">
      <div className="p-4 bg-white border-b sticky top-0 z-10 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/orders/${id}`}>
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </Button>
        <h2 className="font-bold text-lg">Confirmar Entrega</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8 flex-1 pb-32">
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-1" />
          <div className="text-sm">
            <p className="font-bold text-primary">Evidencia Requerida</p>
            <p className="text-primary/70">Captura los datos del receptor para el pedido #{id}.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="receiver_name" className="text-base font-bold">Nombre de quien recibe *</Label>
            <Input 
              id="receiver_name"
              placeholder="Nombre completo"
              className="h-12 bg-white"
              required
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-bold">Firma del receptor *</Label>
            <SignaturePad onCapture={setSignature} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations" className="text-base font-bold">Observaciones (Opcional)</Label>
            <Textarea 
              id="observations"
              placeholder="Ej. Dejado con el vecino, caja dañada, etc."
              className="bg-white min-h-[100px]"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full btn-large bg-primary hover:bg-primary/90 shadow-lg"
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
    </div>
  );
}
