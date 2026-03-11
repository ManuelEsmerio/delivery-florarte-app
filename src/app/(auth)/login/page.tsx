
"use client";

import { useActionState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Lock, Mail, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { loginAction } from '@/app/actions/auth-actions';

export default function LoginPage() {
  const { toast } = useToast();
  
  // Usamos useActionState para manejar la acción de servidor
  const [state, formAction, isPending] = useActionState(loginAction, null);

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: "destructive",
        title: "Error de acceso",
        description: state.error,
      });
    }
  }, [state, toast]);

  return (
    <div className="flex-1 flex flex-col p-8 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white">
      <div className="flex flex-col items-center mb-12">
        <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-lg mb-4 animate-in zoom-in duration-700 delay-150">
          <Truck className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold font-headline text-primary tracking-tight">DriveMate</h1>
        <p className="text-muted-foreground mt-1">Portal para Repartidores</p>
      </div>

      <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-left-4 duration-500 delay-300">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800">
          <p className="font-bold mb-1">Acceso Registrado</p>
          <p>Usa tus credenciales de repartidor para acceder a tu ruta diaria.</p>
        </div>
      </div>

      <form action={formAction} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500">
        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="email" 
              name="email"
              type="email" 
              placeholder="repartidor@empresa.com" 
              className="pl-10 h-12 bg-white transition-all duration-200 focus:ring-primary/20" 
              required 
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Contraseña</Label>
            <button type="button" className="text-xs text-primary font-medium hover:underline">¿Olvidaste tu contraseña?</button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="password" 
              name="password"
              type="password" 
              placeholder="••••••••" 
              className="pl-10 h-12 bg-white transition-all duration-200 focus:ring-primary/20" 
              required 
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full btn-large bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all" 
          disabled={isPending}
        >
          {isPending ? "Validando..." : "Iniciar Sesión"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-12 opacity-0 animate-in fade-in duration-1000 delay-700">
        ¿No tienes acceso? Contacta a Soporte Técnico.
      </p>
    </div>
  );
}
