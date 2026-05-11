/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, User, Heart, Menu, X, LogOut, LayoutDashboard, Settings, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { CartDrawer } from '@/components/layout/CartDrawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';

export default function NavbarV5() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartItemsCount = useAppSelector((state) => state.cart.items.reduce((total, item) => total + item.quantity, 0));
  const wishlistCount = useAppSelector((state) => state.wishlist.items.length);


  const NAV_LINKS = [
    { label: 'Discovery', href: '/shop' },
    { label: 'Atelier', href: '/categories' },
    { label: 'Journal', href: '/blog' }
  ];

  return (
    <nav className="fixed top-8 left-0 right-0 z-50 px-6 animate-in slide-in-from-top-10 duration-1000">
      <div className="container mx-auto max-w-6xl">
        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-3xl rounded-[3rem] border border-white/20 px-10 py-5 flex items-center justify-between shadow-2xl shadow-black/10">
          
          {/* Logo - Artistic Shape */}
          <Link href="/" className="group flex items-center gap-4">
             <div className="h-12 w-12 bg-primary rounded-[1.5rem_0.5rem_1.5rem_0.5rem] rotate-45 group-hover:rotate-0 transition-all duration-700 flex items-center justify-center">
                <span className="text-white font-black text-2xl -rotate-45 group-hover:rotate-0 transition-all">B</span>
             </div>
             <span className="text-2xl font-black tracking-tighter hidden md:block">BD Dukan.</span>
          </Link>

          {/* Centered Artistic Nav */}
          <div className="hidden lg:flex items-center gap-14">
             {NAV_LINKS.map((link) => (
                <Link 
                  key={link.label} 
                  href={link.href}
                  className="text-[10px] font-black uppercase tracking-[0.4em] hover:text-primary transition-all duration-500 relative py-2 group"
                >
                  {link.label}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
             ))}
          </div>

          {/* Actions - Artistic Group */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/shop')}
              className="h-12 w-12 rounded-2xl bg-transparent flex items-center justify-center hover:text-primary hover:scale-110 transition-all outline-none"
              aria-label="Discovery Search"
            >
              <Search className="h-5 w-5" />
            </button>

            <Link 
               href="/dashboard/wishlist" 
               className={`relative hidden sm:flex h-12 w-12 rounded-2xl bg-transparent items-center justify-center hover:text-primary hover:scale-110 transition-all ${wishlistCount > 0 ? 'text-primary' : ''}`}
               aria-label={`Wishlist (${wishlistCount})`}
               onClick={(e) => {
                 if (status !== 'authenticated') {
                   e.preventDefault();
                   toast.error('Please login to view your wishlist');
                 }
               }}
            >
               <Heart className={`h-5 w-5 ${wishlistCount > 0 ? 'fill-current animate-pulse' : ''}`} />
               {wishlistCount > 0 && (
                 <span className="absolute -top-1 -right-1 h-5 w-5 bg-black text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                   {wishlistCount}
                 </span>
               )}
            </Link>

            <CartDrawer>
              <div 
                 className="relative group h-14 w-14 rounded-[2rem] bg-transparent text-foreground flex items-center justify-center hover:scale-110 hover:text-primary transition-all cursor-pointer"
                 aria-label={`Shopping Cart (${cartItemsCount})`}
              >
                 <ShoppingBag className="h-6 w-6" />
                 {cartItemsCount > 0 && (
                   <span className="absolute -top-1 -right-1 h-6 w-6 bg-white text-black text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-primary animate-in zoom-in">
                     {cartItemsCount}
                   </span>
                 )}
              </div>
            </CartDrawer>

            <div className="h-10 w-[1px] bg-black/5 mx-2 hidden md:block" />

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 px-2 py-1 rounded-[1.5rem] bg-transparent hover:bg-transparent hover:scale-110 transition-all cursor-pointer outline-none group">
                    <div className="h-10 w-10 rounded-[1.2rem] border-2 border-primary/20 overflow-hidden group-hover:scale-110 transition-transform">
                      <img src={session.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name || '')}`} alt="Identity" className="h-full w-full object-cover" />
                    </div>
                    <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest pr-2">
                      {session.user?.name?.split(' ')[0]}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-[2.5rem] p-4 bg-white/90 backdrop-blur-3xl border-none shadow-2xl">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-2 pt-2 pb-1 font-black text-[9px] uppercase tracking-widest opacity-40">Profile / Identity</DropdownMenuLabel>
                  </DropdownMenuGroup>
                   <div className="px-2 pb-4 mb-3 border-b border-black/5">
                      <p className="text-sm font-black truncate">{session.user?.name}</p>
                      <p className="text-[10px] opacity-40 truncate">{session.user?.email}</p>
                   </div>
                   
                   {/* Role Based Navigation */}
                   {(session.user as any)?.role === 'super_admin' && (
                     <>
                       <DropdownMenuItem onClick={() => router.push('/admin/dashboard')} className="rounded-2xl cursor-pointer py-3">
                         <LayoutDashboard className="mr-3 h-5 w-5 text-primary" /> Admin Dashboard
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => router.push('/admin/system-design')} className="rounded-2xl cursor-pointer py-3">
                         <Settings className="mr-3 h-5 w-5" /> Infrastructure & Marketing
                       </DropdownMenuItem>
                     </>
                   )}

                   {(session.user as any)?.role === 'admin' && (
                     <>
                       <DropdownMenuItem onClick={() => router.push('/admin/dashboard')} className="rounded-2xl cursor-pointer py-3">
                         <LayoutDashboard className="mr-3 h-5 w-5 text-primary" /> Admin Dashboard
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => router.push('/admin/orders')} className="rounded-2xl cursor-pointer py-3">
                         <Truck className="mr-3 h-5 w-5" /> Manage Orders
                       </DropdownMenuItem>
                     </>
                   )}

                   {(session.user as any)?.role === 'user' && (
                     <>
                       <DropdownMenuItem onClick={() => router.push('/dashboard')} className="rounded-2xl cursor-pointer py-3">
                         <LayoutDashboard className="mr-3 h-5 w-5 text-primary" /> Dashboard
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => router.push('/track-order')} className="rounded-2xl cursor-pointer py-3">
                         <Truck className="mr-3 h-5 w-5" /> Track Order
                       </DropdownMenuItem>
                     </>
                   )}

                   <DropdownMenuSeparator className="bg-black/5" />
                   <DropdownMenuItem onClick={() => signOut({ callbackUrl: window.location.origin })} className="rounded-2xl cursor-pointer py-3 text-red-500">
                     <LogOut className="mr-3 h-5 w-5" /> End Experience
                   </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
               <div className="flex items-center gap-4">
                 <button 
                   onClick={() => router.push('/account')}
                   className="hidden lg:flex h-12 px-8 rounded-2xl bg-black text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-colors shadow-lg"
                 >
                   Join Atelier
                 </button>
                 <button 
                   onClick={() => setMobileMenuOpen(true)}
                   className="lg:hidden h-12 w-12 rounded-2xl bg-black/5 flex items-center justify-center hover:text-primary transition-colors"
                   aria-label="Open Menu"
                 >
                   <Menu className="h-6 w-6" />
                 </button>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu - Artistic Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-white/60 backdrop-blur-3xl lg:hidden animate-in fade-in duration-700">
           <div className="flex flex-col items-center justify-center h-full gap-16">
              {NAV_LINKS.map((link) => (
                <Link 
                  key={link.label} 
                  href={link.href}
                  className="text-6xl font-black tracking-tighter hover:text-primary transition-all duration-500 uppercase italic"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-12 pt-10">
                 <button 
                  onClick={() => { 
                    if (status !== 'authenticated') {
                      toast.error('Please login to view your wishlist');
                      return;
                    }
                    router.push('/dashboard/wishlist'); 
                    setMobileMenuOpen(false); 
                  }} 
                  className="flex flex-col items-center gap-3"
                >
                    <Heart className="h-8 w-8" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Gallery</span>
                 </button>
                 {!session && (
                   <button onClick={() => { router.push('/account'); setMobileMenuOpen(false); }} className="flex flex-col items-center gap-3">
                      <User className="h-8 w-8" />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Identity</span>
                   </button>
                 )}
              </div>
           </div>
           <button 
             className="absolute top-12 right-12 h-16 w-16 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl"
             onClick={() => setMobileMenuOpen(false)}
           >
              <X className="h-8 w-8" />
           </button>
        </div>
      )}
    </nav>
  );
}
