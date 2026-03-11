
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Truck } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

function SplashContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const driverId = searchParams.get('driverId');

  useEffect(() => {
    const timer = setTimeout(() => setProgress(33), 500);
    const timer2 = setTimeout(() => setProgress(66), 1500);
    const timer3 = setTimeout(() => setProgress(100), 2500);
    
    const timer4 = setTimeout(() => {
      // Pasamos el driverId al dashboard para mantener la "sesión" por URL
      const target = driverId ? `/dashboard?driverId=${driverId}` : '/dashboard';
      router.push(target);
    }, 3200);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [router, driverId]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white min-h-screen">
      <div className="relative">
        <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-bounce duration-1000">
          <Truck className="w-12 h-12 text-white" />
        </div>
        <div className="absolute -inset-4 border-4 border-primary/20 rounded-[3rem] animate-ping duration-[2000ms] opacity-20" />
      </div>

      <div className="mt-12 text-center space-y-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cargando tu ruta</h2>
        <p className="text-slate-500 font-medium text-sm">Sincronizando pedidos y GPS...</p>
      </div>

      <div className="w-full max-w-[200px] mt-10">
        <Progress value={progress} className="h-1.5 bg-slate-100" />
      </div>

      <div className="absolute bottom-12 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DriveMate Connect v2.4</p>
      </div>
    </div>
  );
}

export default function SplashPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SplashContent />
    </Suspense>
  );
}
