"use client";

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_ORDERS } from '@/app/lib/mock-data';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Clock, ChevronRight, Package } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const filteredOrders = MOCK_ORDERS.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase()) || 
                         o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Mis Entregas</h1>
        <p className="text-muted-foreground">Hoy, 20 de Mayo, 2024</p>
      </header>

      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por orden o nombre..." 
            className="pl-10 h-11 bg-white border-none shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
          <TabsList className="w-full bg-white/50 p-1 h-11 border-none shadow-sm">
            <TabsTrigger value="all" className="flex-1 text-xs font-bold uppercase tracking-wider">Todos</TabsTrigger>
            <TabsTrigger value="assigned" className="flex-1 text-xs font-bold uppercase tracking-wider">Asignados</TabsTrigger>
            <TabsTrigger value="in_route" className="flex-1 text-xs font-bold uppercase tracking-wider">En Ruta</TabsTrigger>
            <TabsTrigger value="delivered" className="flex-1 text-xs font-bold uppercase tracking-wider">Listo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{order.orderNumber}</h3>
                      <p className="text-sm font-semibold text-primary">{order.customerName}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                      <p className="line-clamp-1">{order.address}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 shrink-0 text-primary" />
                      <p>{order.deliveryTime}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <div className="flex items-center text-primary font-bold text-sm">
                      Ver Detalles
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl">
            <Package className="w-12 h-12 text-muted/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">No hay pedidos que coincidan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
