
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ChevronRight, Package, User } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ status?: string, driverId?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { status: activeStatus = 'OUT_FOR_DELIVERY', driverId: driverIdStr } = await searchParams;
  
  // Usamos el ID del repartidor desde la URL para evitar problemas de cookies
  const driverId = driverIdStr ? parseInt(driverIdStr) : null;

  if (!driverId) {
    // Si no hay ID, mostramos un estado vacío o invitamos a loguear
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen">
        <User className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold">Sesión no encontrada</h2>
        <p className="text-sm text-slate-500 mt-2">Por favor, inicia sesión de nuevo.</p>
        <Link href="/login" className="mt-6 text-primary font-bold">Volver al Login</Link>
      </div>
    );
  }

  // Filtros exclusivos: 'OUT_FOR_DELIVERY' (En Ruta) y 'DELIVERED' (Entregado)
  const filterStatus = activeStatus === 'DELIVERED' ? 'DELIVERED' : 'OUT_FOR_DELIVERY';

  const orders = await prisma.order.findMany({
    where: {
      deliveryDriverId: driverId,
      status: filterStatus as any
    },
    include: {
      orderAddress: true,
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mis Entregas</h1>
            <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
            </p>
          </div>
          <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold border border-primary/20">
            D
          </div>
        </div>
      </header>

      <div className="px-6 pb-4 pt-4">
        <Tabs defaultValue={filterStatus} className="w-full">
          <TabsList className="w-full bg-white shadow-sm p-1 h-12 border-none rounded-xl">
            <TabsTrigger value="OUT_FOR_DELIVERY" asChild className="flex-1 text-xs font-bold uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
              <Link href={`/dashboard?driverId=${driverId}&status=OUT_FOR_DELIVERY`}>En Ruta</Link>
            </TabsTrigger>
            <TabsTrigger value="DELIVERED" asChild className="flex-1 text-xs font-bold uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
              <Link href={`/dashboard?driverId=${driverId}&status=DELIVERED`}>Entregados</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <main className="flex-1 px-6 space-y-5">
        {orders.length > 0 ? (
          orders.map((order, index) => (
            <Link 
              key={order.id} 
              href={`/orders/${order.id}?driverId=${driverId}`} 
              className="block animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all active:scale-[0.98] bg-white overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h2 className="text-lg font-black text-slate-900">#{order.id}</h2>
                      <p className="text-primary font-bold text-sm">
                        {order.orderAddress?.recipientName || "Cliente"}
                      </p>
                    </div>
                    <Badge className={`text-[10px] font-black uppercase px-3 py-1 border-none rounded-lg ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-start text-sm text-slate-600">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1 font-medium">{order.orderAddress?.formattedAddress || "Dirección no disponible"}</span>
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
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center">
            <Package className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-500 text-sm font-bold">No hay pedidos registrados.</p>
          </div>
        )}
      </main>
    </div>
  );
}
