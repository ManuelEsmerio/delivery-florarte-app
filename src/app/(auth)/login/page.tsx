
"use client";

import { useActionState, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { loginAction } from '@/app/actions/auth-actions';

function LoginContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: "destructive",
        title: "Error de acceso",
        description: state.error,
      });
    }

    if (state?.success && state.user) {
      toast({
        title: "Bienvenido",
        description: `Hola, ${state.user.name}`,
      });
      const nextPath = searchParams.get('next');
      const target = nextPath && nextPath.startsWith('/') ? nextPath : '/splash';
      router.push(target);
    }
  }, [state, toast, router, searchParams]);

  return (
    <div className="relative flex-1 overflow-hidden bg-background text-foreground transition-colors duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.18),_transparent_38%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/10 to-transparent" />

      <div className="relative flex min-h-full flex-col justify-center p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto w-full max-w-sm rounded-[2rem] border border-border/80 bg-card/92 p-6 shadow-2xl backdrop-blur-sm transition-colors duration-300">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
              <Truck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-primary tracking-tight">DriveMate</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Portal para Repartidores</p>
          </div>

          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/90">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  placeholder="repartidor@empresa.com" 
                  className="h-12 rounded-2xl border-border bg-background/85 pl-10 text-foreground shadow-sm transition-colors duration-300 placeholder:text-muted-foreground/80"
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/90">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="password" 
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="h-12 rounded-2xl border-border bg-background/85 pl-10 pr-12 text-foreground shadow-sm transition-colors duration-300 placeholder:text-muted-foreground/80"
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full btn-large bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20" 
              disabled={isPending}
            >
              {isPending ? "Validando..." : "Iniciar Sesión"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-10 opacity-80">
            ¿Problemas de acceso? Contacta a Soporte.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex-1 min-h-full bg-background" />}>
      <LoginContent />
    </Suspense>
  );
}
