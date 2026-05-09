/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ShoppingCart, Heart, Eye, MoreVertical, Edit, Trash2, Settings, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { toggleWishlist } from '@/store/slices/wishlistSlice';
import { toast } from 'sonner';
import { QuickAddModal } from './QuickAddModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number;
    images: string[];
    isFeatured?: boolean;
    isNewArrival?: boolean;
    stock: number;
    categories?: any[];
    variants?: any[];
    ratings?: number;
    numReviews?: number;
  };
  isFlashSale?: boolean;
}

export default function ProductCardV4({ product, isFlashSale }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const { data: session, status } = useSession();
  const wishlist = useAppSelector((state) => state.wishlist.items);
  const isInWishlist = wishlist.includes(product._id);
  const router = useRouter();
  const isAdmin = (session?.user as any)?.role === 'admin';
  const hasVariants = product.variants && product.variants.length > 0;

  const [showVariantModal, setShowVariantModal] = useState(false);

  const discount = (product.price > 0 && product.salePrice && product.salePrice < product.price) 
    ? Math.round(((product.price - product.salePrice) / product.price) * 100) 
    : 0;

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasVariants) {
      setShowVariantModal(true);
    } else {
      executeAddToCart();
    }
  };

  const executeAddToCart = () => {
    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: product.salePrice ?? product.price,
      basePrice: product.price,
      quantity: 1,
      image: product.images?.[0] ?? '/placeholder.png'
    }));
    toast.success(`${product.name} added to cart`);
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (status === 'unauthenticated') {
      toast.error('Please login to save to wishlist');
      return;
    }

    // Optimistic update
    dispatch(toggleWishlist(product._id));
    const willBeInWishlist = !isInWishlist;

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id }),
      });
      
      if (!res.ok) {
        throw new Error('Server error updating wishlist');
      }
      
      toast.success(willBeInWishlist ? 'Saved to collection' : 'Removed from collection');
    } catch (err) {
      console.error('Wishlist error:', err);
      // Rollback
      dispatch(toggleWishlist(product._id));
      toast.error('Failed to sync collection. Please try again.');
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.info('Quick View coming soon!');
  };

  const handleDeleteProduct = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${product.slug}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete product');
      }
      toast.success('Product removed successfully');
      router.refresh();
    } catch (err: any) {
      toast.error(`Error: ${err.message || 'Failed to delete product'}`);
    }
  };

  return (
    <div 
      className="group relative flex flex-col bg-background rounded-[2rem] p-4 transition-all duration-700 hover:shadow-2xl hover:shadow-primary/5"
      data-aos="fade-up"
    >
      {/* Boutique Image Container */}
      <div className="relative aspect-square rounded-[1.5rem] overflow-hidden bg-neutral-50 dark:bg-neutral-900 group-hover:shadow-lg transition-all duration-700">
        <Link href={`/product/${product.slug}`} className="block h-full w-full">
          {product.images?.length > 1 ? (
            <>
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover transition-opacity duration-1000 group-hover:opacity-0"
              />
              <Image
                src={product.images[1]}
                alt={product.name}
                fill
                className="absolute inset-0 object-cover opacity-0 transition-opacity duration-1000 group-hover:opacity-100"
              />
            </>
          ) : (
            <Image
              src={product.images?.[0] || '/placeholder.png'}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
            />
          )}
        </Link>

        {/* Elegant Overlays */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {discount > 0 && (
            <span className="bg-white/80 backdrop-blur-md text-primary text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-sm">
              Selection -{discount}%
            </span>
          )}
          {isFlashSale && (
            <span className="bg-primary text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-sm animate-pulse">
              Flash Deal
            </span>
          )}
        </div>

        {/* Bottom Actions Overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 translate-y-12 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 z-10">
           <Button
             size="icon"
             variant="secondary"
             className="h-10 w-10 rounded-full shadow-xl bg-white/90 dark:bg-neutral-900/90 hover:bg-primary hover:text-white transition-colors"
             onClick={handleFavorite}
           >
             <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-primary text-primary' : ''}`} />
           </Button>
           <Button
             size="icon"
             variant="secondary"
             className="h-10 w-10 rounded-full shadow-xl bg-white/90 dark:bg-neutral-900/90 hover:bg-primary hover:text-white transition-colors"
             onClick={handleQuickView}
           >
             <Eye className="h-4 w-4" />
           </Button>
        </div>

        {/* Admin Float */}
        {isAdmin && (
          <div className="absolute top-4 right-4 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40">
                  <MoreVertical className="h-4 w-4 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={() => router.push(`/admin/products/${product.slug}`)}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteProduct} className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Boutique Content Section */}
      <div className="pt-6 pb-2 px-2 flex flex-col items-center text-center">
        {(product.numReviews || 0) > 0 && (
          <div 
            className="flex items-center gap-1.5 mb-2"
            aria-label={`${product.ratings || 0} out of 5 stars, ${product.numReviews || 0} reviews`}
          >
              <div className="flex gap-0.5 text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < Math.floor(product.ratings || 0) ? 'fill-current' : 'text-muted-foreground'}`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground font-black tracking-widest">
                ({product.numReviews})
              </span>
          </div>
        )}
        
        <Link href={`/product/${product.slug}`} className="block mb-2">
          <h3 className="text-xl font-serif italic tracking-tight line-clamp-1 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex flex-col items-center gap-1 mb-4">
           <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-foreground">
                ৳{Math.round(product.salePrice ?? product.price)}
              </span>
              {product.salePrice && (
                <span className="text-sm text-muted-foreground line-through opacity-50">
                  ৳{Math.round(product.price)}
                </span>
              )}
           </div>
           {product.isNewArrival && <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.3em]">New Collection</span>}
        </div>

        <Button 
          variant="outline"
          className="w-full h-12 rounded-2xl border-neutral-200 dark:border-neutral-800 hover:bg-primary hover:text-white hover:border-primary transition-all duration-500 font-bold uppercase tracking-[0.2em] text-[10px]"
          onClick={handleAddToCartClick}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Sold Out' : 'Discover More'}
        </Button>
      </div>

      {hasVariants && (
        <QuickAddModal
          product={product}
          isOpen={showVariantModal}
          onClose={() => setShowVariantModal(false)}
        />
      )}
    </div>
  );
}
