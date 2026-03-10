"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MOCK_ORDERS } from '@/app/lib/mock-data';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import Link from 'next/link';
import { SignaturePad } from '@/components/SignaturePad';
import { useToast } from "@/hooks/use-toast";

export default function DeliveryConfirmationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const order = MOCK_ORDERS.find(o => o.id === id);

  const [receiverName, setReceiverName] = useState('');
  const [signature, setSignature] = useState('');
  const [observations, setObservations] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!order) return <div className="p-10 text-center">Order not found.</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) {
      toast({
        variant: "destructive",
        title: "Signature Required",
        description: "Please have the receiver sign before completing."
      });
      return;
    }

    setSubmitting(true);
    // Simulate API call and GPS capture
    setTimeout(() => {
      setSubmitting(false);
      toast({
        title: "Delivery Success!",
        description: `Order ${order.orderNumber} delivered to ${receiverName}.`
      });
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="p-4 bg-white border-b sticky top-0 z-10 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/orders/${order.id}`}>
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </Button>
        <h2 className="font-bold text-lg">Confirm Delivery</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8 flex-1">
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-1" />
          <div className="text-sm">
            <p className="font-bold text-primary">Verification Required</p>
            <p className="text-primary/70">Capture proof of delivery for order #{order.orderNumber}.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="receiver_name" className="text-base font-bold">Receiver Name *</Label>
            <Input 
              id="receiver_name"
              placeholder="Full name of the person receiving"
              className="h-12 bg-white"
              required
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-bold">Receiver Signature *</Label>
            <SignaturePad onCapture={setSignature} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations" className="text-base font-bold">Observations (Optional)</Label>
            <Textarea 
              id="observations"
              placeholder="e.g., Left with neighbor, Damaged box, etc."
              className="bg-white min-h-[100px]"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-slate-100 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <MapPin className="w-4 h-4 text-primary" />
            GPS Data Captured
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {order.lat.toFixed(4)}, {order.lng.toFixed(4)}
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full btn-large bg-accent hover:bg-accent/90 mb-10"
          disabled={submitting}
        >
          {submitting ? "Processing..." : (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Complete Delivery
            </>
          )}
        </Button>
      </form>
    </div>
  );
}