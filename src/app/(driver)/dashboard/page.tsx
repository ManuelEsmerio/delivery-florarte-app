
import { prisma } from '@/lib/prisma';
import { getDriverSession } from '@/app/actions/auth-actions';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Clock, ChevronRight, Package, CreditCard } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { status: activeStatus = 'ALL' } = await searchParams;
  
  await cookies();
  const session = await getDriverSession();
  const driverId = session.id;

  // Construcción dinámica de la cláusula WHERE
  const whereClause: any = {
    deliveryDriverId: driverId,
  };

  if (activeStatus === 'DELIVERED') {
    whereClause.status = 'DELIVERED';
  } else if (activeStatus === 'IN_ROUTE') {
    whereClause.status = 'OUT_FOR_DELIVERY';
  } else if (activeStatus === 'PENDING') {
    // Si el error persiste, simplificamos a un solo estado común o verificamos los nombres exactos
    whereClause.status = 'READY_FOR_SHIPMENT';
  }

  // Obtenemos las órdenes filtradas
  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      orderAddress: true,
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  });

  // Conteos para los badges de las pestañas
  const counts = await prisma.order.groupBy({
    by: ['status'],
    where: { deliveryDriverId: driverId },
    _count: true
  });

  const getCount = (statuses: string[]) => {
    return counts
      .filter(c => statuses.includes(c.status))
      .reduce((acc, curr) => acc + curr._count, 0);
  };

  const totalDelivered = getCount(['DELIVERED']);
  const totalInRoute = getCount(['OUT_FOR_DELIVERY']);
  const totalPending = getCount(['READY_FOR_SHIPMENT', 'ASSIGNED', 'PENDING', 'READY']);
  const totalAll = counts.reduce((acc, curr) => acc + curr._count, 0);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      READY_FOR_SHIPMENT: 'Asignado',
      READY: 'Listo',
      ASSIGNED: 'Asignado',
      PENDING: 'Pendiente',
      OUT_FOR_DELIVERY: 'En Ruta',
      DELIVERED: 'Entregado',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'DELIVERED': return 'bg-green-100 text-green-700';
      case 'OUT_FOR_DELIVERY': return 'bg-primary text-white';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="flex flex-col min-h-full animate-in fade-in duration-500 pb-24">
      <header className="pt-10 px-6 pb-2 bg-white/50">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Hola, {session.name.split(' ')[0]}</h1>
            <p className="text-sm text-slate-500 font-medium mt-1 uppercase">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
            </p>
          </div>
          <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
            {session.name.charAt(0)}
          </div>
        </div>
      </header>

      <div className="px-6 pb-4 pt-4 space-y-4">
        <div className="relative group">
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          <input 
            placeholder="Buscar pedido..." 
            className="w-full pl-10 pr-3 py-3 border-none bg-white rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <Tabs defaultValue={activeStatus} className="w-full">
          <TabsList className="w-full bg-white/50 p-1 h-11 border-none shadow-sm flex overflow-x-auto no-scrollbar">
            <TabsTrigger value="ALL" asChild className="flex-1 text-[9px] font-bold uppercase tracking-wider">
              <Link href="/dashboard?status=ALL">Todos ({totalAll})</Link>
            </TabsTrigger>
            <TabsTrigger value="PENDING" asChild className="flex-1 text-[9px] font-bold uppercase tracking-wider">
              <Link href="/dashboard?status=PENDING">Nuevos ({totalPending})</Link>
            </TabsTrigger>
            <TabsTrigger value="IN_ROUTE" asChild className="flex-1 text-[9px] font-bold uppercase tracking-wider">
              <Link href="/dashboard?status=IN_ROUTE">En Ruta ({totalInRoute})</Link>
            </TabsTrigger>
            <TabsTrigger value="DELIVERED" asChild className="flex-1 text-[9px] font-bold uppercase tracking-wider">
              <Link href="/dashboard?status=DELIVERED">Listos ({totalDelivered})</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <main className="flex-1 px-6 space-y-5">
        {orders.length > 0 ? (
          orders.map((order, index) => (
            <Link 
              key={order.id} 
              href={`/orders/${order.id}`} 
              className="block animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all active:scale-[0.98] bg-white overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h2 className="text-lg font-black text-slate-900">ORD-{order.id}</h2>
                      <p className="text-primary font-bold text-sm">
                        {order.orderAddress?.recipientName || "Cliente"}
                      </p>
                    </div>
                    <Badge className={`text-[10px] font-black uppercase px-3 py-1 border-none ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-start text-sm text-slate-600">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">{order.orderAddress?.formattedAddress || "Dirección no disponible"}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Clock className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
                      <span className="font-medium tracking-tight">
                        {order.deliveryTimeSlot || "Sin horario"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-50 flex justify-end">
                    <div className="text-primary text-xs font-black uppercase tracking-widest flex items-center">
                      Detalles
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100">
            <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 text-sm font-bold">Sin pedidos asignados.</p>
            <p className="text-slate-400 text-xs mt-1">ID Repartidor: {driverId}</p>
          </div>
        )}
      </main>
    </div>
  );
}
