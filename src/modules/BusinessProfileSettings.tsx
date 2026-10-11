import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Building2, MapPin, Tablet, Mail, Globe, Share2, Upload, Save, CheckCircle2 } from 'lucide-react';
import { AppState, BusinessProfile } from '../types';

interface Props {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export default function BusinessProfileSettings({ state, setState }: Props) {
  const [profile, setProfile] = useState<BusinessProfile>(state.businessProfile);
  const [message, setMessage] = useState('');

  const handleSave = () => {
    setState(prev => ({
      ...prev,
      businessProfile: profile
    }));
    setMessage('Business profile updated successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-3xl font-bold text-slate-800">Business Identity</h3>
          <p className="text-sm text-slate-400 mt-2 font-medium">Update your company details for invoices and reports.</p>
        </div>
        <button 
          onClick={handleSave}
          className="px-8 py-3.5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
        >
          <Save size={16} /> Save Changes
        </button>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 font-black uppercase text-[10px] tracking-widest"
        >
          <CheckCircle2 size={16} /> {message}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Basic Info & Logo */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
               <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">
                  <Building2 size={24} />
               </div>
               <h4 className="font-black text-slate-800 uppercase tracking-widest">Office Registry</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Legal Company Name</label>
                  <input 
                    type="text"
                    value={profile.name}
                    onChange={e => setProfile({...profile, name: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-sm"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">GSTIN Number</label>
                  <input 
                    type="text"
                    value={profile.gstin}
                    onChange={e => setProfile({...profile, gstin: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-sm uppercase"
                  />
               </div>
               <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Principal Address</label>
                  <textarea 
                    rows={3}
                    value={profile.address}
                    onChange={e => setProfile({...profile, address: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-sm resize-none"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">City</label>
                  <input 
                    type="text"
                    value={profile.city}
                    onChange={e => setProfile({...profile, city: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-sm"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Pin Code</label>
                  <input 
                    type="text"
                    value={profile.pincode}
                    onChange={e => setProfile({...profile, pincode: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-sm"
                  />
               </div>
            </div>
          </div>

          <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
               <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black">
                  <Globe size={24} />
               </div>
               <h4 className="font-black text-slate-800 uppercase tracking-widest">Connect & Online</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Public Phone</label>
                  <div className="relative">
                    <Tablet size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="text"
                      value={profile.phone}
                      onChange={e => setProfile({...profile, phone: e.target.value})}
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-sm"
                    />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Business Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="email"
                      value={profile.email}
                      onChange={e => setProfile({...profile, email: e.target.value})}
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-sm"
                    />
                  </div>
               </div>
               <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Official Website</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="text"
                      value={profile.website}
                      onChange={e => setProfile({...profile, website: e.target.value})}
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-sm"
                    />
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Logo & Social */}
        <div className="space-y-8">
          <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
             <div className="text-center space-y-4">
                <div className="w-32 h-32 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 mx-auto flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                   {profile.logoUrl ? (
                     <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
                   ) : (
                     <>
                        <Upload size={24} className="text-slate-300 group-hover:text-primary" />
                        <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-primary">Upload Logo</span>
                     </>
                   )}
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">System supports PNG / JPG.<br/>Max resolution 512x512px.</p>
             </div>
          </div>

          <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
             <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <Share2 size={16} className="text-primary" />
                <h4 className="font-black text-slate-800 uppercase tracking-widest text-[11px]">Social Network</h4>
             </div>
             
             <div className="space-y-4">
                {['facebook', 'instagram', 'twitter', 'linkedin'].map((social) => (
                   <div key={social} className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">{social}</label>
                      <input 
                        type="text"
                        value={(profile.socialLinks as any)[social] || ''}
                        onChange={e => setProfile({
                          ...profile,
                          socialLinks: { ...profile.socialLinks, [social]: e.target.value }
                        })}
                        placeholder={`https://${social}.com/...`}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none focus:bg-white text-xs font-bold"
                      />
                   </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
