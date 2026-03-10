import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col min-h-full p-6 space-y-6">
      <header className="pt-4 pb-2 space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </header>

      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 flex-1 rounded-md" />
          ))}
        </div>
      </div>

      <main className="space-y-5">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="pt-4 border-t border-slate-50 flex justify-end">
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
}
