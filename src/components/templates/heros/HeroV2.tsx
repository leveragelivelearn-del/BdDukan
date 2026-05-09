/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, PlayCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroV2Props {
  banners: any[];
}

export default function HeroV2({ banners }: HeroV2Props) {
  const banner = banners?.[0];
  const title = banner?.title ?? 'Elevated Living Essentials';
  const subtitle = banner?.subtitle ?? 'CURATED COLLECTION 2026';
  const image = banner?.image ?? '/placeholder.png';

  return (
    <section className="relative min-h-screen flex items-center bg-background overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-24 -z-10" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-y-32 -translate-x-32" />

      <div className="container mx-auto px-4 md:px-12 grid lg:grid-cols-2 gap-16 items-center pt-24 pb-16">
        
        {/* Story Content */}
        <div className="space-y-10 animate-in slide-in-from-left duration-1000">
           <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] border border-primary/20">
              <Sparkles className="h-4 w-4 fill-current" />
              Direct from artisan atelier
           </div>
           
           <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.8] uppercase">
              {title.split(' ').map((word: string, i: number) => (
                <span key={i} className="block last:text-primary last:italic">
                  {word}
                </span>
              ))}
           </h1>

           <p className="text-muted-foreground text-lg md:text-2xl max-w-xl leading-relaxed font-medium italic">
              {subtitle}
           </p>

           <div className="flex flex-wrap gap-6 pt-6">
              <Link href="/shop">
                <Button size="lg" className="h-20 px-12 rounded-[2rem] bg-primary text-white hover:bg-black transition-all font-black text-xl gap-4 shadow-2xl shadow-primary/20 group">
                   Begin Selection <ArrowRight className="h-6 w-6 group-hover:translate-x-3 transition-transform" />
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="ghost" size="lg" className="h-20 px-8 rounded-full font-black text-lg gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all">
                   <PlayCircle className="h-6 w-6 text-primary" /> The Story
                </Button>
              </Link>
           </div>

           <div className="flex items-center gap-10 pt-12">
              <div className="flex flex-col">
                 <span className="text-3xl font-black leading-none">4.9/5</span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Client Satisfaction</span>
              </div>
              <div className="h-10 w-[1px] bg-neutral-200 dark:bg-neutral-800" />
              <div className="flex flex-col">
                 <span className="text-3xl font-black leading-none">24H</span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Global Dispatch</span>
              </div>
           </div>
        </div>

        {/* Cinematic Visual */}
        <div className="relative group animate-in zoom-in duration-1000 delay-300">
           {/* Abstract Framing */}
           <div className="absolute inset-0 bg-primary/20 rounded-[4rem] rotate-6 scale-95 blur-2xl opacity-30 group-hover:rotate-0 transition-transform duration-[2s]" />
           
           <div className="relative aspect-[4/5] lg:h-[750px] w-full rounded-[4rem] overflow-hidden border-[12px] border-white dark:border-neutral-900 shadow-2xl shadow-black/10 transition-all duration-[2s] hover:scale-[1.02]">
              <Image 
                src={image} 
                alt={title}
                fill
                priority
                className="object-cover transition-transform duration-[4s] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
           </div>

           {/* Floating Certification Badge */}
           <div className="absolute -top-10 -right-10 h-40 w-40 bg-white dark:bg-neutral-900 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-primary/20 animate-spin-slow p-6 text-center">
              <ShieldCheck className="h-8 w-8 text-primary mb-2" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-tight">Certified Authentic Masterpiece</span>
           </div>
        </div>

      </div>
    </section>
  );
}
