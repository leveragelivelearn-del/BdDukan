/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { Instagram, Youtube, Twitter } from '@/components/ui/social-icons';
import { Sparkles, MoveUpRight } from 'lucide-react';
import DeveloperLogo from '@/components/ui/developerlogo';


export default function FooterV5() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-50 dark:bg-neutral-950 py-40 px-6 overflow-hidden">
      <div className="container mx-auto">
        <div className="flex flex-col items-center text-center space-y-16 mb-40">
           <div className="space-y-6">
              <div className="inline-flex items-center gap-3 text-primary font-black uppercase tracking-[0.6em] text-[10px]">
                 <Sparkles className="h-4 w-4 fill-primary" /> The Artistic Conclusion
              </div>
              <h2 className="text-7xl md:text-[15rem] font-black tracking-tighter leading-none uppercase">
                BD Dukan.
              </h2>
           </div>
           
           <div className="flex flex-wrap justify-center gap-12 md:gap-24">
              {['Discovery', 'Curated', 'Journal', 'Inquiry', 'Legal'].map((item, i) => (
                <Link 
                  key={item} 
                  href="#" 
                  className="group flex items-center gap-2 text-2xl md:text-5xl font-black uppercase tracking-tighter hover:text-primary transition-all"
                >
                  {item} <MoveUpRight className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-2 group-hover:-translate-y-2" />
                </Link>
              ))}
           </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-16 items-end pt-20 border-t border-neutral-200 dark:border-neutral-800">
           <div className="space-y-6">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-400">Identity Channels</span>
              <div className="flex gap-10">
                 <Link href="#" className="hover:text-primary transition-colors flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                    <Instagram className="h-4 w-4" /> Instagram
                 </Link>
                 <Link href="#" className="hover:text-primary transition-colors flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                    <Youtube className="h-4 w-4" /> Youtube
                 </Link>
                 <Link href="#" className="hover:text-primary transition-colors flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                    <Twitter className="h-4 w-4" /> Twitter
                 </Link>
              </div>
           </div>

           <div className="text-center space-y-4">
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">Architecture by</div>
              <span className="text-2xl font-black uppercase tracking-tighter">BD Dukan Atelier</span>
           </div>

           <div className="flex flex-col items-end gap-6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 text-right">
                 © {currentYear} ALL NARRATIVES PROTECTED. <br /> ESTABLISHED IN THE DIGITAL HORIZON.
              </p>
              <DeveloperLogo className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100" />
           </div>
        </div>
      </div>
    </footer>
  );
}
