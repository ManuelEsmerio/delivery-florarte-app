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
    <div className="flex flex-col min-h-full">
      <header className="pt-10 px-6 pb-2 bg-white/50">
        <h1 className="text-2xl font-bold text-slate-900">My Deliveries</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Today, May 20, 2024</p>
      </header>

      <div className="px-6 pb-6 sticky top-0 bg-background/80 backdrop-blur-md z-10 pt-4 space-y-4">
        <div className="relative group">
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
          <Input 
            placeholder="Search by order or name..." 
            className="pl-10 h-12 bg-white border-none shadow-sm text-sm placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
          <TabsList className="w-full bg-white/50 p-1 h-11 border-none shadow-sm">
            <TabsTrigger value="all" className="flex-1 text-[10px] font-bold uppercase tracking-wider">All</TabsTrigger>
            <TabsTrigger value="assigned" className="flex-1 text-[10px] font-bold uppercase tracking-wider">Assigned</TabsTrigger>
            <TabsTrigger value="in_route" className="flex-1 text-[10px] font-bold uppercase tracking-wider">In Route</TabsTrigger>
            <TabsTrigger value="delivered" className="flex-1 text-[10px] font-bold uppercase tracking-wider">Done</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <main className="flex-1 px-6 pb-28 overflow-y-auto space-y-5">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="block">
              <Card className="rounded-lg card-shadow border border-slate-100 hover:shadow-lg transition-all active:scale-[0.98]">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{order.orderNumber}</h2>
                      <p className="text-primary font-semibold text-sm">{order.customerName}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-start text-sm text-slate-600">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">{order.address}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Clock className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
                      <span>{order.deliveryTime}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                    <div className="text-primary text-sm font-bold flex items-center hover:opacity-80">
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-lg card-shadow border border-slate-100">
            <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 text-sm font-medium">No deliveries match your search.</p>
          </div>
        )}
      </main>
    </div>
  );
}
