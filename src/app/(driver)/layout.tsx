
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, User } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { icon: LayoutGrid, label: 'Inicio', href: '/dashboard' },
    { icon: User, label: 'Perfil', href: '/profile' },
  ];

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-md bg-white border-t border-slate-200 h-16 flex items-center justify-around z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 w-full h-full transition-all duration-300 relative group",
                isActive ? "text-primary" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className={cn(
                "p-1 rounded-xl transition-all duration-300 group-active:scale-90",
                isActive && "bg-primary/5"
              )}>
                <Icon className={cn("h-6 w-6 transition-all duration-300", isActive && "stroke-[2.5px] scale-110")} />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                isActive ? "opacity-100 translate-y-0" : "opacity-80 translate-y-0.5"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full animate-in zoom-in duration-300" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
