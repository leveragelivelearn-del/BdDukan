/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, Menu, X, Heart, LogOut, LayoutDashboard, Settings, Truck } from 'lucide-react';
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
} from '@/components/ui/dropdown-menu';

export default function NavbarV2() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartItemsCount = useAppSelector((state) => state.cart.items.reduce((total, item) => total + item.quantity, 0));
  const wishlistCount = useAppSelector((state) => state.wishlist.items.length);


  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const NAV_LINKS = [
    { label: 'Collection', href: '/shop' },
    { label: 'Categories', href: '/categories' },
    { label: 'Flash Sale', href: '/shop?filter=flash' },
    { label: 'Journal', href: '/blog' }
  ];

  return (
    <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl transition-all duration-700 ${isScrolled ? 'top-2' : 'top-4'}`}>
      <div className={`rounded-[2rem] border border-white/10 px-8 py-3 flex items-center justify-between transition-all duration-700 ${isScrolled ? 'bg-black/80 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] py-2' : 'bg-black/30 backdrop-blur-xl shadow-xl'}`}>
        
        {/* Mobile Menu Trigger */}
        <button 
          className="lg:hidden text-white hover:text-primary transition-colors" 
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Toggle Menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo */}
        <Link href="/" className="text-3xl font-black text-white tracking-tighter hover:scale-105 transition-transform flex items-center gap-1 group">
          BD DUKAN<span className="text-primary group-hover:animate-ping">.</span>
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden lg:flex items-center gap-10">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link 
                href={link.href} 
                className="text-[11px] font-black text-white/60 hover:text-primary transition-all duration-500 uppercase tracking-[0.3em] relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary transition-all duration-500 group-hover:w-full" />
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions Container */}
        <div className="flex items-center gap-2 md:gap-5">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-transparent hover:scale-110 transition-all rounded-full"
            onClick={() => router.push('/shop')}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          <Link 
            href="/dashboard/wishlist" 
            className="relative group"
            onClick={(e) => {
              if (status !== 'authenticated') {
                e.preventDefault();
                toast.error('Please login to view your wishlist');
              }
            }}
          >
            <Button variant="ghost" size="icon" className="text-white hover:bg-transparent hover:scale-110 transition-all rounded-full relative">
              <Heart className="h-5 w-5 group-hover:fill-primary transition-all" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-[9px] font-black text-white rounded-full flex items-center justify-center border-2 border-black animate-in zoom-in duration-300">
                  {wishlistCount}
                </span>
              )}
            </Button>
          </Link>

          <CartDrawer>
            <div className="relative group cursor-pointer hover:scale-110 transition-all">
              <Button variant="ghost" size="icon" className="text-white hover:bg-transparent rounded-full relative pointer-events-none">
                <ShoppingCart className="h-5 w-5 group-hover:text-primary transition-all" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-white text-[9px] font-black text-black rounded-full flex items-center justify-center border-2 border-black animate-in zoom-in duration-300">
                    {cartItemsCount}
                  </span>
                )}
              </Button>
            </div>
          </CartDrawer>

          <div className="hidden md:block h-6 w-[1px] bg-white/10" />

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 group cursor-pointer outline-none">
                  <div className="h-9 w-9 rounded-full border-2 border-primary/50 overflow-hidden group-hover:scale-110 transition-transform relative">
                    <Image 
                      src={session.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name || '')}`} 
                      alt={session.user?.name || 'User'} 
                      fill
                      className="object-cover" 
                    />
                  </div>
                  <span className="hidden sm:block text-xs font-bold text-white/90 group-hover:text-primary transition-colors">
                    {session.user?.name?.split(' ')[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-black/90 backdrop-blur-3xl text-white border-white/10 shadow-2xl">
                <DropdownMenuLabel className="px-3 pt-3 pb-1 font-black text-xs uppercase tracking-widest opacity-50">Identity</DropdownMenuLabel>
                <div className="px-3 pb-3 mb-2 border-b border-white/10">
                   <p className="text-sm font-bold truncate">{session.user?.name}</p>
                   <p className="text-[10px] opacity-60 truncate">{session.user?.email}</p>
                </div>
                
                {/* Role Based Navigation */}
                {(session.user as any)?.role === 'super_admin' && (
                  <>
                    <DropdownMenuItem onClick={() => router.push('/admin/dashboard')} className="rounded-xl cursor-pointer hover:bg-primary/20">
                      <LayoutDashboard className="mr-2 h-4 w-4 text-primary" /> Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/admin/system-design')} className="rounded-xl cursor-pointer hover:bg-primary/20">
                      <Settings className="mr-2 h-4 w-4" /> Infrastructure & Marketing
                    </DropdownMenuItem>
                  </>
                )}

                {(session.user as any)?.role === 'admin' && (
                  <>
                    <DropdownMenuItem onClick={() => router.push('/admin/dashboard')} className="rounded-xl cursor-pointer hover:bg-primary/20">
                      <LayoutDashboard className="mr-2 h-4 w-4 text-primary" /> Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/admin/orders')} className="rounded-xl cursor-pointer hover:bg-primary/20">
                      <Truck className="mr-2 h-4 w-4" /> Manage Orders
                    </DropdownMenuItem>
                  </>
                )}

                {(session.user as any)?.role === 'user' && (
                  <>
                    <DropdownMenuItem onClick={() => router.push('/dashboard')} className="rounded-xl cursor-pointer hover:bg-primary/20">
                      <LayoutDashboard className="mr-2 h-4 w-4 text-primary" /> Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/track-order')} className="rounded-xl cursor-pointer hover:bg-primary/20">
                      <Truck className="mr-2 h-4 w-4" /> Track Order
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: window.location.origin })} className="rounded-xl cursor-pointer text-red-400 hover:bg-red-400/10">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button className="rounded-full bg-primary text-white hover:bg-white hover:text-black font-black text-[10px] px-8 py-6 uppercase tracking-widest shadow-xl shadow-primary/20 transition-all">
                Access
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-3xl lg:hidden animate-in fade-in zoom-in duration-500">
          <div className="flex justify-end p-8">
            <button 
              className="text-white hover:text-primary transition-colors" 
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-10 w-10" />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center h-full -mt-20 gap-10">
             {NAV_LINKS.map((link) => (
                <Link 
                  key={link.label} 
                  href={link.href}
                  className="text-5xl font-black text-white hover:text-primary transition-all duration-500 uppercase tracking-tighter"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
             ))}
             {!session && (
               <Link href="/login" className="mt-10" onClick={() => setMobileMenuOpen(false)}>
                 <Button className="rounded-full bg-primary text-white w-56 h-16 font-black text-xl uppercase tracking-widest">
                    Access
                 </Button>
               </Link>
             )}
          </div>
        </div>
      )}
    </nav>
  );
}
