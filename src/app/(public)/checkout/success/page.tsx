'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShoppingBag, ArrowRight, Home, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we have an ID, we could fetch the order details, 
    // but a success message is usually enough for the UX.
    setLoading(false);
  }, [id]);

  return (
    <div className="container px-4 md:px-6 py-24 flex flex-col items-center text-center animate-in fade-in duration-700">
      <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-8 border-8 border-green-50 shadow-xl shadow-green-500/20">
        <CheckCircle2 className="h-12 w-12 text-green-600 animate-bounce" />
      </div>
      
      <h1 className="text-4xl font-black tracking-tight mb-4">Order Confirmed!</h1>
      <p className="text-muted-foreground text-lg max-w-[600px] mb-2 leading-relaxed">
        Thank you for your purchase! We've received your order and we're getting it ready for delivery.
      </p>
      {id && (
        <p className="text-sm font-mono text-muted-foreground bg-muted px-4 py-2 rounded-full mb-10 inline-block">
          Order ID: <span className="font-bold text-foreground">#{id}</span>
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[400px]">
        <Link href="/shop" className="w-full">
            <Button variant="outline" className="w-full h-12 rounded-full font-bold group">
                <ShoppingBag className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Continue Shopping 
            </Button>
        </Link>
        <Link href="/dashboard" className="w-full">
            <Button className="w-full h-12 rounded-full font-bold group shadow-lg shadow-primary/20">
                View My Orders <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
        <div className="container py-24 flex justify-center items-center h-[50vh]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    }>
        <SuccessContent />
    </Suspense>
  );
}
