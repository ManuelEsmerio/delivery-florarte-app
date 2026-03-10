"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Lock, Mail, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Bienvenido de nuevo",
        description: "Sesión iniciada correctamente.",
      });
      // Redirect to splash for data initialization
      router.push('/splash');
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col p-8 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          <p className="font-bold mb-1">Modo de Demostración</p>
          <p>Puedes usar cualquier correo (ej. <strong>driver@drivemate.com</strong>) y cualquier contraseña para ingresar.</p>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500">
        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="email" 
              type="email" 
              placeholder="driver@drivemate.com" 
              className="pl-10 h-12 bg-white transition-all duration-200 focus:scale-[1.01]" 
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
              type="password" 
              placeholder="••••••••" 
              className="pl-10 h-12 bg-white transition-all duration-200 focus:scale-[1.01]" 
              required 
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full btn-large bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all" 
          disabled={loading}
        >
          {loading ? "Autenticando..." : "Iniciar Sesión"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-12 opacity-0 animate-in fade-in duration-1000 delay-700">
        ¿No tienes cuenta? Contacta a Despacho.
      </p>
    </div>
  );
}
