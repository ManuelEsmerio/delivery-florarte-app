
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Truck } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { fetchDriverSession } from '@/lib/driver-session';

function SplashContent() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let timer2: ReturnType<typeof setTimeout> | undefined;
    let timer3: ReturnType<typeof setTimeout> | undefined;
    let timer4: ReturnType<typeof setTimeout> | undefined;

    const bootstrapSession = async () => {
      const session = await fetchDriverSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      timer = setTimeout(() => setProgress(33), 500);
      timer2 = setTimeout(() => setProgress(66), 1500);
      timer3 = setTimeout(() => setProgress(100), 2500);
      timer4 = setTimeout(() => {
        router.push('/dashboard');
      }, 3200);
    };

    bootstrapSession();

    return () => {
      if (timer) clearTimeout(timer);
      if (timer2) clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);
      if (timer4) clearTimeout(timer4);
    };
  }, [router]);

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center p-8 bg-background text-foreground min-h-screen overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.18),_transparent_38%)]" />
      <div className="relative">
        <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-bounce duration-1000">
          <Truck className="w-12 h-12 text-white" />
        </div>
        <div
          className="absolute -inset-4 border-4 border-primary/20 rounded-[3rem] animate-ping opacity-20"
          style={{ animationDuration: '2000ms' }}
        />
      </div>

      <div className="mt-12 text-center space-y-2">
        <h2 className="text-2xl font-black text-foreground tracking-tight">Cargando tu ruta</h2>
        <p className="text-muted-foreground font-medium text-sm">Sincronizando pedidos y GPS...</p>
      </div>

      <div className="w-full max-w-[200px] mt-10">
        <Progress value={progress} className="h-1.5 bg-muted" />
      </div>

      <div className="absolute bottom-12 text-center">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">DriveMate Connect v2.4</p>
      </div>
    </div>
  );
}

export default function SplashPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SplashContent />
    </Suspense>
  );
}
