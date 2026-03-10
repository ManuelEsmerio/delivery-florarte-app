import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/app/lib/mock-data";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const variants: Record<OrderStatus, string> = {
    assigned: "bg-slate-100 text-slate-600 hover:bg-slate-100 border-none font-bold px-2.5 py-0.5",
    in_route: "bg-primary text-white hover:bg-primary border-none font-bold px-2.5 py-0.5",
    delivered: "bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold px-2.5 py-0.5",
    failed: "bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold px-2.5 py-0.5",
  };

  const labels: Record<OrderStatus, string> = {
    assigned: "Assigned",
    in_route: "In Route",
    delivered: "Delivered",
    failed: "Failed",
  };

  return (
    <Badge className={variants[status]}>
      {labels[status]}
    </Badge>
  );
}
