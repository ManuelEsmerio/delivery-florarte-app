
"use client";

import { useState, useTransition, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Settings, 
  LogOut, 
  KeyRound, 
  Shield, 
  ChevronRight,
  Truck
} from 'lucide-react';
import { logoutAction, updatePasswordAction } from '@/app/actions/auth-actions';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [driverUser, setDriverUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('driver_user');
    if (user) {
      setDriverUser(JSON.parse(user));
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = async () => {
    localStorage.removeItem('driver_user');
    await logoutAction();
    toast({ title: "Sesión cerrada", description: "Has salido correctamente del sistema." });
    router.push('/login');
  };

  const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!driverUser) return;
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await updatePasswordAction(driverUser.id, formData);
      
      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error
        });
      } else if (result?.success) {
        toast({
          title: "¡Éxito!",
          description: "Tu contraseña ha sido actualizada correctamente."
        });
        setShowPasswordForm(false);
      }
    });
  };

  if (!driverUser) return null;

  return (
    <div className="p-6 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Mi Perfil</h1>
        <Button variant="ghost" size="icon" className="hover:rotate-45 transition-transform duration-300">
          <Settings className="w-6 h-6 text-muted-foreground" />
        </Button>
      </header>

      <section className="bg-primary rounded-3xl p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{driverUser.name}</h2>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{driverUser.email}</p>
          </div>
        </div>
        <Truck className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
      </section>

      <div className="space-y-3">
        <button 
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="w-full bg-white p-5 rounded-2xl flex items-center justify-between shadow-sm active:scale-[0.98] transition-all hover:bg-slate-50 group"
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
          <form onSubmit={handlePasswordChange} className="bg-white p-6 rounded-2xl shadow-inner border-2 border-slate-50 space-y-4 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Contraseña Actual</Label>
              <Input id="oldPassword" name="oldPassword" type="password" required className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input id="newPassword" name="newPassword" type="password" required className="h-11" />
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
          className="w-full bg-red-50 p-5 rounded-2xl flex items-center justify-between border border-red-100 active:scale-[0.98] transition-all hover:bg-red-100 group"
        >
          <div className="flex items-center gap-3 text-red-600">
            <div className="bg-red-100 p-2 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm">Cerrar Sesión</span>
          </div>
        </button>
      </div>
    </div>
  );
}
