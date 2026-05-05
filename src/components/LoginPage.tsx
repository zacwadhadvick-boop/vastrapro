import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, ExternalLink } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginPageProps {
  onLogin: (user: UserType) => void;
  expectedCredentials?: { username: string; password: string };
}

export default function LoginPage({ onLogin, expectedCredentials }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Artificial delay for "offline feel" (loading locally)
    setTimeout(() => {
      const targetUser = expectedCredentials?.username || 'admin';
      const targetPass = expectedCredentials?.password || '12345';

      if (username === targetUser && password === targetPass) {
        onLogin({ id: '1', username: targetUser, role: 'admin' });
      } else {
        setError('Invalid credentials');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans">
      {/* Background Image / Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1594633309242-42593a81f1ad?auto=format&fit=crop&q=80&w=2000")',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/60 to-black/40 backdrop-blur-[2px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="glass-card rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden border-[#b4914a]/30">
          {/* Logo Area */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 flex items-center justify-center text-primary">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                   <path d="M50 10 L80 90 L50 70 L20 90 Z" />
                   <circle cx="50" cy="40" r="10" className="fill-accent" />
                </svg>
              </div>
            </div>
            <h1 className="font-serif text-5xl font-bold text-primary tracking-tight">VastraBill <span className="text-accent">Pro</span></h1>
            <div className="flex items-center justify-center gap-4 mt-4">
               <div className="h-px w-8 bg-accent/40" />
               <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">Garment Billing Software</p>
               <div className="h-px w-8 bg-accent/40" />
            </div>
            <p className="italic text-slate-500 text-xs mt-4">Smart Billing. Stylish Business.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex rounded-xl overflow-hidden border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <div className="bg-primary px-4 flex items-center text-white">
                  <User size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  placeholder="Username"
                  className="w-full px-4 py-3.5 bg-slate-50/50 outline-none text-slate-700 font-medium"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="flex rounded-xl overflow-hidden border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <div className="bg-primary px-4 flex items-center text-white">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="Password"
                  className="w-full px-4 py-3.5 bg-slate-50/50 outline-none text-slate-700 font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" />
                Remember Me
              </label>
              <button type="button" className="text-primary hover:underline">Forgot Password?</button>
            </div>

            <button
              id="login-button"
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/30 hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm tracking-widest"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock size={18} /> LOGIN
                </>
              )}
            </button>
          </form>

          <footer className="mt-12 pt-6 border-t border-accent/10 text-center">
             <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
               <div className="w-4 h-px bg-slate-200" />
               by <span className="text-secondary-foreground font-black text-slate-600">Digital Communique</span>
               <div className="w-4 h-px bg-slate-200" />
             </div>
             <p className="text-[9px] text-slate-300 mt-2 italic font-medium">A Product of Digital Communique Private Limited</p>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}
