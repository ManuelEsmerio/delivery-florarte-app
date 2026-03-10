import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/app/lib/mock-data";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const variants: Record<OrderStatus, string> = {
    assigned: "bg-slate-200 text-slate-700 hover:bg-slate-200 border-none",
    in_route: "bg-accent text-accent-foreground hover:bg-accent border-none font-bold",
    delivered: "bg-green-100 text-green-700 hover:bg-green-100 border-none",
    failed: "bg-destructive/10 text-destructive hover:bg-destructive/10 border-none",
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