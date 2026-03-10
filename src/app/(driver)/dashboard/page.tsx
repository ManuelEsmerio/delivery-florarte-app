"use client";

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_ORDERS } from '@/app/lib/mock-data';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Clock, ChevronRight } from 'lucide-react';
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  
  const filteredOrders = MOCK_ORDERS.filter(o => 
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) || 
    o.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">My Deliveries</h1>
        <p className="text-muted-foreground">Today, May 20, 2024</p>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by order or name..." 
          className="pl-10 h-11 bg-white border-none shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
                      View Details
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
            <p className="text-muted-foreground">No matching deliveries found.</p>
          </div>
        )}
      </div>
    </div>
  );
}