import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { auth } from '@/auth';

// POST sync cart with database
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || typeof session.user.email !== 'string' || session.user.email.trim() === '') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { cartItems } = await req.json();

    if (!Array.isArray(cartItems)) {
      return NextResponse.json({ message: 'cartItems must be an array' }, { status: 400 });
    }

    // Validate each cart item
    for (const item of cartItems) {
      if (
        !item || 
        typeof item !== 'object' || 
        (!item.productId && item.productId !== 0) || 
        (typeof item.productId !== 'string' && typeof item.productId !== 'number') ||
        typeof item.quantity !== 'number' || 
        item.quantity <= 0 || 
        !Number.isInteger(item.quantity)
      ) {
        console.error('Invalid cart item detected:', item);
        return NextResponse.json({ 
          message: 'invalid cart item', 
          details: item ? { productId: item.productId, quantity: item.quantity } : 'null item' 
        }, { status: 400 });
      }
    }

    await connectToDatabase();
    const { getTenantDomain } = await import('@/lib/tenant');
    const domain = await getTenantDomain();
    if (!domain) {
      return NextResponse.json({ message: 'Tenant domain is missing' }, { status: 400 });
    }

    const user = await User.findOne({ email: session.user.email.trim(), domain });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Replace the entire cart with the incoming array.
    // The incoming array is assumed to be the merged result from the frontend.
    user.cart = cartItems;

    await user.save();

    return NextResponse.json(user.cart);
  } catch (error: any) {
    console.error('Error syncing cart:', error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
