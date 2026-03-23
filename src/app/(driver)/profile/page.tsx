
"use client";

import { useState, useTransition, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Settings, 
  LogOut, 
  KeyRound, 
  ChevronRight,
  Truck,
  Moon,
  Sun
} from 'lucide-react';
import { updatePasswordAction } from '@/app/actions/auth-actions';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { clearDriverSession, fetchDriverSession, type DriverSession } from '@/lib/driver-session';

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [session, setSession] = useState<DriverSession | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    let isActive = true;

    const bootstrapSession = async () => {
      const driverSession = await fetchDriverSession();

      if (!isActive) return;

      if (driverSession) {
        setSession(driverSession);
      } else {
        router.replace('/login');
      }
    };

    bootstrapSession();

    return () => {
      isActive = false;
    };
  }, [router]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    clearDriverSession();
    await fetch('/api/logout', { method: 'POST' });
    toast({ title: "Sesión cerrada", description: "Has salido correctamente del sistema." });
    router.push('/login');
  };

  const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session) return;
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await updatePasswordAction(formData);
      
      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error
        });
      } else if (result?.success) {
        clearDriverSession();
        toast({
          title: "¡Éxito!",
          description: "Tu contraseña fue actualizada. Inicia sesión nuevamente."
        });
        router.replace('/login');
      }
    });
  };

  if (!session) return null;

  return (
    <div className="min-h-full bg-background p-6 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-foreground transition-colors duration-300">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Mi Perfil</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(true)}
          className="text-muted-foreground hover:bg-transparent hover:text-foreground active:bg-transparent focus-visible:ring-0"
        >
          <Settings className="w-6 h-6 text-muted-foreground" />
        </Button>
      </header>

      <section className="bg-primary rounded-3xl p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden transition-colors duration-300">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{session.user.name}</h2>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{session.user.email}</p>
          </div>
        </div>
        <Truck className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
      </section>

      <div className="space-y-3">
        <button 
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="w-full rounded-2xl bg-card p-5 text-card-foreground flex items-center justify-between shadow-sm border border-border active:scale-[0.98] transition-all hover:bg-muted/60 group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <KeyRound className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm">Seguridad y Acceso</span>
          </div>
          <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${showPasswordForm ? 'rotate-90' : ''}`} />
        </button>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="bg-card text-card-foreground p-6 rounded-2xl shadow-inner border border-border space-y-4 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Contraseña Actual</Label>
              <Input id="oldPassword" name="oldPassword" type="password" required className="h-11 rounded-xl border-border bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input id="newPassword" name="newPassword" type="password" required className="h-11 rounded-xl border-border bg-muted/50" />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary h-12 font-bold"
              disabled={isPending}
            >
              {isPending ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>
          </form>
        )}

        <button 
          onClick={handleLogout}
          className="w-full bg-red-50 dark:bg-red-950/30 p-5 rounded-2xl flex items-center justify-between border border-red-100 dark:border-red-900/60 active:scale-[0.98] transition-all hover:bg-red-100 dark:hover:bg-red-950/40 group"
        >
          <div className="flex items-center gap-3 text-red-600 dark:text-red-300">
            <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm">Cerrar Sesión</span>
          </div>
        </button>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[380px] rounded-[2rem] border border-border bg-card p-0 text-card-foreground overflow-hidden">
          <div className="bg-primary px-6 py-5 text-white">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-xl font-black">
                <Settings className="size-5" />
                Configuración
              </DialogTitle>
              <DialogDescription className="pt-1 text-xs font-bold uppercase tracking-widest text-white/75">
                Apariencia de la aplicación
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 p-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tema</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`rounded-2xl border p-4 text-left transition-all ${theme === 'light' ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-border bg-background text-foreground hover:bg-muted/60'}`}
                >
                  <Sun className="size-5" />
                  <p className="mt-3 text-sm font-black">Modo Claro</p>
                  <p className={`text-[11px] font-medium ${theme === 'light' ? 'text-white/80' : 'text-muted-foreground'}`}>Fondo limpio y mayor brillo.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`rounded-2xl border p-4 text-left transition-all ${theme === 'dark' ? 'border-foreground bg-foreground text-background shadow-lg shadow-black/20' : 'border-border bg-background text-foreground hover:bg-muted/60'}`}
                >
                  <Moon className="size-5" />
                  <p className="mt-3 text-sm font-black">Modo Oscuro</p>
                  <p className={`text-[11px] font-medium ${theme === 'dark' ? 'text-background/70' : 'text-muted-foreground'}`}>Menos brillo para uso nocturno.</p>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-xs font-medium text-muted-foreground">
              Tema actual: {isMounted ? (theme === 'dark' ? 'Oscuro' : 'Claro') : 'Cargando...'}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
