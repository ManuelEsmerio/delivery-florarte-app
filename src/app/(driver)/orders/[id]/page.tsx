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
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const order = MOCK_ORDERS.find(o => o.id === id);

  if (!order) return <div className="p-10 text-center">Order not found.</div>;

  return (
    <div className="flex flex-col min-h-screen animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-4 bg-white border-b sticky top-0 z-10 flex items-center justify-between">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </Button>
        <h2 className="font-bold text-lg">{order.orderNumber}</h2>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Map Preview Placeholder */}
        <div className="h-48 bg-slate-300 relative overflow-hidden">
          <img 
            src={`https://picsum.photos/seed/${order.id}/800/400`} 
            alt="Map view" 
            className="w-full h-full object-cover opacity-60 grayscale-[0.5]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/90 p-3 rounded-full shadow-lg">
              <MapPin className="w-8 h-8 text-white animate-bounce" />
            </div>
          </div>
          <div className="absolute bottom-4 right-4">
            <Button size="sm" className="bg-white text-primary hover:bg-white shadow-md rounded-full px-4 h-10">
              <Navigation className="w-4 h-4 mr-2" />
              Open GPS
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Recipient</p>
                <h3 className="text-xl font-bold">{order.customerName}</h3>
              </div>
              <Button variant="secondary" size="icon" className="rounded-full bg-accent/20 text-accent-foreground hover:bg-accent/30">
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
          <section className="bg-white p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Order Items</h3>
            </div>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b last:border-none">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold">×{item.quantity}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Notes */}
          {order.deliveryNotes && (
            <section className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-primary">Driver Notes</h3>
              </div>
              <p className="text-sm text-blue-900 leading-relaxed italic">
                "{order.deliveryNotes}"
              </p>
            </section>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 pt-0 bg-transparent mb-24">
        {order.status === 'assigned' && (
          <Button 
            className="w-full btn-large bg-primary"
            onClick={() => router.push(`/dashboard`)} // Simulating status change
          >
            Start Route
          </Button>
        )}
        {(order.status === 'in_route' || order.status === 'assigned') && (
          <Button 
            className="w-full btn-large bg-accent hover:bg-accent/90 mt-3"
            asChild
          >
            <Link href={`/orders/${order.id}/deliver`}>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Complete Delivery
            </Link>
          </Button>
        )}
        {order.status === 'delivered' && (
          <div className="bg-green-100 text-green-700 p-4 rounded-xl text-center font-bold flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Order Completed
          </div>
        )}
      </div>
    </div>
  );
}