"use client";

import { useState } from 'react';
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
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleLogout = () => {
    toast({ title: "Logged Out", description: "You have been securely signed out." });
    router.push('/login');
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Password Updated", description: "Your credentials have been changed successfully." });
    setShowPasswordForm(false);
  };

  return (
    <div className="p-6 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold animate-in slide-in-from-left-4 duration-500">Account</h1>
        <Button variant="ghost" size="icon" className="hover:rotate-45 transition-transform duration-300">
          <Settings className="w-6 h-6 text-muted-foreground" />
        </Button>
      </header>

      {/* Driver Identity Card */}
      <section className="bg-primary rounded-3xl p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden animate-in zoom-in-95 duration-500 delay-100">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold">John Doe</h2>
            <p className="text-white/70 text-sm font-medium">Employee ID: DRV-4492</p>
          </div>
        </div>
        <div className="mt-6 flex gap-3 relative z-10">
          <div className="bg-white/10 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
            Active Driver
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
            Vehicle: Transit #82
          </div>
        </div>
        <Truck className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12 transition-transform duration-1000 hover:rotate-0" />
      </section>

      {/* Stats Quick View */}
      <div className="grid grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-200">
        {[
          { label: 'Deliveries', value: '42' },
          { label: 'Rating', value: '4.9' },
          { label: 'On Time', value: '98%' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl text-center shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
            <p className="text-2xl font-black text-primary">{stat.value}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Menu Options */}
      <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500 delay-300">
        <button 
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="w-full bg-white p-5 rounded-2xl flex items-center justify-between shadow-sm active:scale-[0.98] transition-all hover:bg-slate-50 group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <KeyRound className="w-5 h-5" />
            </div>
            <span className="font-bold">Security & Password</span>
          </div>
          <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${showPasswordForm ? 'rotate-90' : ''}`} />
        </button>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="bg-white p-6 rounded-2xl shadow-inner border-2 border-slate-50 space-y-4 animate-in slide-in-from-top-4 duration-300 overflow-hidden">
            <div className="space-y-2">
              <Label htmlFor="old-pass">Current Password</Label>
              <Input id="old-pass" type="password" required className="h-11 transition-all focus:scale-[1.01]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pass">New Password</Label>
              <Input id="new-pass" type="password" required className="h-11 transition-all focus:scale-[1.01]" />
            </div>
            <Button type="submit" className="w-full bg-primary h-12 shadow-md hover:shadow-lg transition-all">Update Password</Button>
          </form>
        )}

        <button className="w-full bg-white p-5 rounded-2xl flex items-center justify-between shadow-sm active:scale-[0.98] transition-all hover:bg-slate-50 group">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-bold">Privacy Policy</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        <button 
          onClick={handleLogout}
          className="w-full bg-red-50 p-5 rounded-2xl flex items-center justify-between border border-red-100 active:scale-[0.98] transition-all hover:bg-red-100 group"
        >
          <div className="flex items-center gap-3 text-red-600">
            <div className="bg-red-100 p-2 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-bold">Log Out</span>
          </div>
        </button>
      </div>

      <div className="text-center opacity-0 animate-in fade-in duration-1000 delay-500">
        <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">DriveMate v2.4.0 (Production)</p>
      </div>
    </div>
  );
}
