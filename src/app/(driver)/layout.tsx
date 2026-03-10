"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, User } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard' },
    { icon: User, label: 'Profile', href: '/profile' },
  ];

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-md bg-white border-t border-slate-200 h-16 flex items-center justify-around z-50">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors relative",
                isActive ? "text-primary" : "text-slate-400"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
