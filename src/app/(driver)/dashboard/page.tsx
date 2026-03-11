
import { prisma } from '@/lib/prisma';
import { getDriverSession } from '@/app/actions/auth-actions';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Clock, ChevronRight, Package, CreditCard, Info } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription } from "@/components/ui/alert";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const session = await getDriverSession();
  const driverId = session.id;

  console.log(`DEBUG [Dashboard]: Consultando órdenes para driverId: ${driverId}`);

  // 1. Intentamos cargar órdenes específicas del repartidor
  let orders = await prisma.order.findMany({
    where: {
      deliveryDriverId: driverId,
    },
    include: {
      orderAddress: true,
      user: true,
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });

  // 2. Fallback Debug: Si no hay órdenes para ese ID, cargamos CUALQUIER orden 
  // para verificar que la DB tiene datos y la conexión funciona.
  let isUsingFallback = false;
  if (orders.length === 0) {
    console.log("DEBUG [Dashboard]: No se encontraron órdenes para el ID específico. Cargando órdenes globales como fallback.");
    orders = await prisma.order.findMany({
      include: {
        orderAddress: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    isUsingFallback = orders.length > 0;
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      READY_FOR_SHIPMENT: 'Asignado',
      OUT_FOR_DELIVERY: 'En Ruta',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'DELIVERED': return 'bg-green-100 text-green-700';
      case 'OUT_FOR_DELIVERY': return 'bg-primary text-white';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
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
        {isUsingFallback && (
          <Alert className="bg-blue-50 border-blue-200 text-blue-800">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-[11px] font-medium">
              Mostrando órdenes globales (Modo Debug). No se encontraron pedidos asignados a tu ID ({driverId}).
            </AlertDescription>
          </Alert>
        )}

        <div className="relative group">
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          <input 
            placeholder="Buscar pedido..." 
            className="w-full pl-10 pr-3 py-3 border-none bg-white rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="w-full bg-white/50 p-1 h-11 border-none shadow-sm">
            <TabsTrigger value="today" className="flex-1 text-[10px] font-bold uppercase tracking-wider">
              {isUsingFallback ? "Todas las Órdenes" : "Mis Entregas"} ({orders.length})
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
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all active:scale-[0.98] bg-white overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h2 className="text-lg font-black text-slate-900">ORD-{order.id}</h2>
                      <p className="text-primary font-bold text-sm">
                        {order.orderAddress?.recipientName || order.guestName || "Cliente"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`text-[10px] font-black uppercase px-3 py-1 border-none ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </Badge>
                      {order.dedication && (
                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 text-[10px] py-0 px-1.5 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          MENSAJE
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-start text-sm text-slate-600">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">{order.orderAddress?.formattedAddress || "Dirección no disponible"}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Clock className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
                      <span>{order.deliveryTimeSlot || "Sin horario"}</span>
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
            <p className="text-slate-500 text-sm font-bold">Sin datos encontrados.</p>
            <p className="text-slate-400 text-xs mt-1">La base de datos parece estar vacía o inaccesible.</p>
          </div>
        )}
      </main>
    </div>
  );
}
