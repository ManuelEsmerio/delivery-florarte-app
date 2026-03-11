
"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, User, Map } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Suspense } from 'react';

function DriverNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const driverId = searchParams.get('driverId');
  
  // Función para mantener el driverId en todos los enlaces de navegación
  const getUrl = (base: string) => {
    return driverId ? `${base}?driverId=${driverId}` : base;
  };

  const openGoogleMaps = () => {
    // Abre Google Maps en una nueva pestaña
    window.open('https://www.google.com/maps', '_blank');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-md bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 h-20 flex items-center justify-around z-50 px-6">
      <Link 
        href={getUrl('/dashboard')}
        className={cn(
          "flex flex-col items-center justify-center space-y-1 w-full h-full transition-all duration-300",
          pathname === '/dashboard' ? "text-primary" : "text-slate-400"
        )}
      >
        <Home className={cn("h-6 w-6", pathname === '/dashboard' && "stroke-[2.5px]")} />
        <span className="text-[10px] font-bold uppercase tracking-tighter">Inicio</span>
      </Link>

      <div className="relative -top-6 shrink-0">
        <button 
          onClick={openGoogleMaps}
          className="size-16 bg-primary rounded-full shadow-xl shadow-primary/40 flex items-center justify-center text-white border-4 border-background active:scale-90 transition-transform"
          title="Abrir Google Maps"
        >
          <Map className="h-8 w-8" />
        </button>
      </div>

      <Link 
        href={getUrl('/profile')}
        className={cn(
          "flex flex-col items-center justify-center space-y-1 w-full h-full transition-all duration-300",
          pathname === '/profile' ? "text-primary" : "text-slate-400"
        )}
      >
        <User className={cn("h-6 w-6", pathname === '/profile' && "stroke-[2.5px]")} />
        <span className="text-[10px] font-bold uppercase tracking-tighter">Perfil</span>
      </Link>
    </nav>
  );
}

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        {children}
      </main>

      <Suspense fallback={<div className="h-20 bg-white border-t" />}>
        <DriverNav />
      </Suspense>
    </div>
  );
}
