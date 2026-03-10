import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/app/lib/mock-data";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const variants: Record<OrderStatus, string> = {
    assigned: "bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200 text-[10px] font-black tracking-wider uppercase px-3 py-1",
    in_route: "bg-primary text-white hover:bg-primary border-none text-[10px] font-black tracking-wider uppercase px-3 py-1",
    delivered: "bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-[10px] font-black tracking-wider uppercase px-3 py-1",
    failed: "bg-red-100 text-red-700 hover:bg-red-100 border-red-200 text-[10px] font-black tracking-wider uppercase px-3 py-1",
  };

  const labels: Record<OrderStatus, string> = {
    assigned: "Asignado",
    in_route: "En Ruta",
    delivered: "Entregado",
    failed: "Fallido",
  };

  return (
    <Badge variant="outline" className={variants[status]}>
      {labels[status]}
    </Badge>
  );
}
