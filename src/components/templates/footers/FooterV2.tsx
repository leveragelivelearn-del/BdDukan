/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube } from '@/components/ui/social-icons';
import { Mail, MapPin, Phone, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DeveloperLogo from '@/components/ui/developerlogo';


export default function FooterV2() {
  const currentYear = new Date().getFullYear();

  const LINKS = {
    discovery: [
      { label: 'Collection', href: '/shop' },
      { label: 'Categories', href: '/categories' },
      { label: 'Journal', href: '/blog' },
      { label: 'Atelier', href: '/about' }
    ],
    support: [
      { label: 'Assistance', href: '/help' },
      { label: 'Tracking', href: '/track' },
      { label: 'Returns', href: '/returns' },
      { label: 'Security', href: '/privacy' }
    ]
  };

  return (
    <footer className="bg-black text-white pt-32 pb-12 px-6 overflow-hidden">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-32">
          
          {/* Brand Essence */}
          <div className="lg:col-span-5 space-y-10">
            <Link href="/" className="text-4xl font-black tracking-tighter hover:text-primary transition-colors">
              BD DUKAN<span className="text-primary">.</span>
            </Link>
            <p className="text-neutral-500 text-lg max-w-sm leading-relaxed font-medium italic">
              Curating high-precision commerce experiences for the modern explorer. Established in Dhaka, reaching globally.
            </p>
            <div className="flex items-center gap-6">
               {[
                 { Icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
                 { Icon: Twitter, label: 'Twitter', href: 'https://twitter.com' },
                 { Icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
                 { Icon: Youtube, label: 'Youtube', href: 'https://youtube.com' }
               ].map(({ Icon, label, href }) => (
                 <Link 
                   key={label} 
                   href={href} 
                   target="_blank"
                   rel="noopener noreferrer"
                   aria-label={`Follow us on ${label}`}
                   className="h-12 w-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all group"
                 >
                    <Icon className="h-5 w-5 text-neutral-400 group-hover:text-white" />
                 </Link>
               ))}
            </div>
          </div>

          {/* Navigation Modules */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-12">
             <div className="space-y-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Discovery</h4>
                <ul className="space-y-4">
                   {LINKS.discovery.map(link => (
                     <li key={link.label}>
                        <Link href={link.href} className="text-sm font-bold text-neutral-400 hover:text-white hover:tracking-widest transition-all">
                           {link.label}
                        </Link>
                     </li>
                   ))}
                </ul>
             </div>
             <div className="space-y-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Assistance</h4>
                <ul className="space-y-4">
                   {LINKS.support.map(link => (
                     <li key={link.label}>
                        <Link href={link.href} className="text-sm font-bold text-neutral-400 hover:text-white hover:tracking-widest transition-all">
                           {link.label}
                        </Link>
                     </li>
                   ))}
                </ul>
             </div>
          </div>

          {/* Connect Module */}
          <div className="lg:col-span-3 space-y-8">
             <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">The Feed</h4>
             <div className="space-y-6">
                <p className="text-xs text-neutral-500 font-medium">Join our global network for elite updates and curated releases.</p>
                <form 
                  className="relative group"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const email = (e.currentTarget.elements.namedItem('subscriptionEmail') as HTMLInputElement).value;
                    if (email) {
                      toast.success('Identity Registered. Welcome to the Network.');
                      (e.target as HTMLFormElement).reset();
                    }
                  }}
                >
                   <input 
                    type="email"
                    id="subscriptionEmail"
                    name="subscriptionEmail"
                    aria-label="Email address for subscription"
                    className="w-full bg-transparent border-b border-white/20 pb-4 text-sm focus:outline-none focus:border-primary transition-all placeholder:text-neutral-700" 
                    placeholder="Enter Identity (Email)" 
                    required
                   />
                   <button 
                    type="submit"
                    aria-label="Subscribe to newsletter"
                    className="absolute right-0 bottom-4 text-primary hover:translate-x-2 transition-transform"
                   >
                      <ArrowUpRight className="h-5 w-5" />
                   </button>
                </form>
             </div>
          </div>
        </div>

        {/* Legal Architectural Layer */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-[9px] font-black uppercase tracking-[0.3em] text-neutral-600">
           <p>© {currentYear} BD DUKAN PREMIUM ATELIER. ALL RIGHTS RESERVED.</p>
           <div className="flex items-center gap-12">
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Protocol</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="/sitemap" className="hover:text-primary transition-colors">Architecture</Link>
           </div>
           <DeveloperLogo className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 invert" />
        </div>
      </div>
    </footer>
  );
}
