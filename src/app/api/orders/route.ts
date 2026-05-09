/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order, { IOrderItem } from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import GlobalSettings from '@/models/GlobalSettings';
import WalletTransaction from '@/models/WalletTransaction';
import Coupon from '@/models/Coupon';
import { auth } from '@/auth';

import { z } from 'zod';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { getTenantDomain } from '@/lib/tenant';

class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StockError';
  }
}


const orderItemSchema = z.object({
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  name: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  price: z.number().positive(), // We will re-validate this on the server
  image: z.string().nullish().or(z.literal('')),
  color: z.string().optional(),
  size: z.string().optional(),
});

const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  shippingAddress: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    phone: z.string().min(10, 'Invalid phone number'),
    email: z.string().email('Invalid email address'),
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    division: z.string().min(1, 'Division is required'),
    zipCode: z.string().optional().default('0000'),
    country: z.string().optional().default('Bangladesh'),
  }),
  paymentMethod: z.preprocess((val) => {
    if (typeof val === 'string') {
      const normalized = val.trim().toLowerCase();
      if (normalized === 'cash on delivery' || normalized === 'cod') {
        return 'COD';
      }
    }
    return val;
  }, z.enum(['COD', 'Online'])),
  deliveryCharge: z.number().min(0).nullish(),
  useWallet: z.boolean().nullish().default(false),
  couponCode: z.string().nullish(),
  manualPaymentDetails: z.object({
    methodName: z.string().optional(),
    senderNumber: z.string().optional(),
    transactionId: z.string().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  let session: mongoose.ClientSession | null = null;
  
  try {
    const sessionUser = await auth();
    const body = await req.json();

    // 1. Validate Input Schema
    const validation = orderSchema.safeParse(body);
    if (!validation.success) {
      console.error('Order Validation Error:', validation.error.flatten().fieldErrors);
      return NextResponse.json({ 
        message: 'Validation failed', 
        errors: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { items, shippingAddress, paymentMethod, useWallet, couponCode, manualPaymentDetails } = validation.data;
    const clientProvidedDeliveryCharge = validation.data.deliveryCharge;

    const domain = await getTenantDomain();
    if (!domain) {
      return NextResponse.json({ message: 'Tenant domain is missing' }, { status: 400 });
    }

    const conn = await connectToDatabase();
    
    // Fetch Settings for the current domain
    const settings = await GlobalSettings.findOne({ domain });
    const subConfig = settings?.subscriptionConfig || { activationThreshold: 5000, rewardPercentage: 5 };

    session = await conn.startSession();
    if (!session) {
        throw new Error('Failed to start database session');
    }
    session.startTransaction();

    let user = null;
    if (sessionUser?.user?.id) {
      user = await User.findOne({ _id: sessionUser.user.id, domain }).session(session);
    } else {
      // Guest Checkout: Find or Create User by Email within the current domain
      user = await User.findOne({ email: shippingAddress.email.toLowerCase(), domain }).session(session);
      
      if (user) {
        // If user exists but lacks phone or address, update it
        let needsUpdate = false;
        if (!user.phone && shippingAddress.phone) {
          user.phone = shippingAddress.phone;
          needsUpdate = true;
        }
        if ((!user.addresses || user.addresses.length === 0) && shippingAddress.street) {
          user.addresses = [{
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            division: shippingAddress.division,
            country: shippingAddress.country,
            isDefault: true
          }];
          needsUpdate = true;
        }
        if (needsUpdate) {
          await user.save({ session });
        }
      } else {
        // Create a new user for this guest
        const [newUser] = await User.create([{
          name: shippingAddress.fullName,
          email: shippingAddress.email.toLowerCase(),
          phone: shippingAddress.phone,
          domain,
          role: 'user',
          addresses: [{
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            division: shippingAddress.division,
            country: shippingAddress.country,
            isDefault: true
          }]
        }], { session });
        user = newUser;
      }
    }

    let serverComputedTotal = 0;
    const validatedItems: IOrderItem[] = [];

    // 2. Atomic Stock Validation and Price Verification
    for (const item of items) {
      let product;
      const hasVariant = !!(item.color || item.size);

      if (hasVariant) {
        // Attempt to update variant stock
        const variantQuery: any = { 
          _id: item.product, 
          domain, // Add domain filter
          isPublished: true,
          variants: {
            $elemMatch: {
              ...(item.color && { color: item.color }),
              ...(item.size && { size: item.size }),
              stock: { $gte: item.quantity }
            }
          }
        };
        
        product = await Product.findOneAndUpdate(
          variantQuery,
          { $inc: { "variants.$.stock": -item.quantity } },
          { session, new: true }
        );
      } else {
        // Fallback to main stock
        product = await Product.findOneAndUpdate(
          { 
            _id: item.product, 
            domain, // Add domain filter
            stock: { $gte: item.quantity },
            isPublished: true 
          },
          { $inc: { stock: -item.quantity } },
          { session, new: true }
        );
      }

      if (!product) {
        const variantDesc = [item.color, item.size].filter(Boolean).join(' / ');
        throw new StockError(`Insufficient stock or product not found: ${item.name}${variantDesc ? ` (${variantDesc})` : ''}`);
      }

      // 2b. Determine Price (Server-side source of truth)
      let itemPrice = product.salePrice ?? product.price;
      let itemPurchasePrice = product.purchasePrice ?? 0;
      if (hasVariant) {
        const variant = product.variants?.find((v: any) => 
          (v.color || undefined) === (item.color || undefined) &&
          (v.size || undefined) === (item.size || undefined)
        );
        if (variant) {
          itemPrice = (variant.salePrice ?? variant.price) ?? (product.salePrice ?? product.price);
          itemPurchasePrice = variant.purchasePrice ?? product.purchasePrice ?? 0;
        }
      }

      const lineTotal = itemPrice * item.quantity;
      serverComputedTotal += lineTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: itemPrice,
        purchasePrice: itemPurchasePrice,
        image: item.image || product.images?.[0] || '',
        color: item.color,
        size: item.size,
      });
    }

    // 3. Calculate Delivery Charge
    const isDhaka = 
      shippingAddress.city.toLowerCase().includes('dhaka') || 
      shippingAddress.state.toLowerCase().includes('dhaka') ||
      shippingAddress.division.toLowerCase().includes('dhaka');
    
    const freeDeliveryThreshold = settings?.freeDeliveryThreshold || 0;
    const isFreeDelivery = freeDeliveryThreshold > 0 && serverComputedTotal >= freeDeliveryThreshold;
    
    const chargeInsideDhaka = settings?.deliveryChargeInsideDhaka || 60;
    const chargeOutsideDhaka = settings?.deliveryChargeOutsideDhaka || 120;
    
    const serverComputedDeliveryCharge = isFreeDelivery ? 0 : (isDhaka ? chargeInsideDhaka : chargeOutsideDhaka);

    // 4. Verify Delivery Charge (if provided by client)
    if (clientProvidedDeliveryCharge !== undefined && clientProvidedDeliveryCharge !== null && clientProvidedDeliveryCharge !== serverComputedDeliveryCharge) {
      console.warn('Delivery Charge Mismatch:', { 
        client: clientProvidedDeliveryCharge, 
        server: serverComputedDeliveryCharge,
        city: shippingAddress.city,
        state: shippingAddress.state
      });
      if (session) await session.abortTransaction();
      return NextResponse.json({ 
        message: 'Delivery charge mismatch. Please refresh your cart.',
        serverCharge: serverComputedDeliveryCharge
      }, { status: 400 });
    }

    // 5. Discount & Loyalty Logic
    let couponDiscountAmount = 0;
    let walletAmountUsed = 0;
    let earnedRewardAmount = 0;
    let walletTxId: string | null = null;

    const baseTotal = serverComputedTotal + serverComputedDeliveryCharge;

    // --- A. Coupon Logic ---
    if (couponCode) {
      const coupon = await Coupon.findOneAndUpdate(
        { 
          code: couponCode.toUpperCase(), 
          domain, // Filter by domain
          isActive: true,
          expiryDate: { $gt: new Date() },
          minPurchase: { $lte: baseTotal },
          $or: [
            { usageLimit: { $exists: false } },
            { usageLimit: { $gt: 0 }, $expr: { $lt: ["$usedCount", "$usageLimit"] } }
          ]
        },
        { $inc: { usedCount: 1 } },
        { session, returnDocument: 'after' }
      );

      if (!coupon) {
        console.warn('Invalid or Expired Coupon:', { couponCode, baseTotal });
        if (session) await session.abortTransaction();
        return NextResponse.json({ 
          message: 'Invalid, expired, or minimum purchase not met for this coupon code.' 
        }, { status: 400 });
      }

      if (coupon.discountType === 'fixed') {
        couponDiscountAmount = coupon.discountValue;
      } else {
        couponDiscountAmount = Math.floor(serverComputedTotal * (coupon.discountValue / 100));
      }
      // Ensure discount doesn't exceed total
      couponDiscountAmount = Math.min(couponDiscountAmount, serverComputedTotal);
    }

    const totalAfterCoupon = baseTotal - couponDiscountAmount;

    // --- B. Wallet & Loyalty Logic ---
    if (user) {
      // Wallet Deduction (Apply on amount after coupon)
      if (useWallet && user.walletBalance > 0) {
        walletAmountUsed = Math.min(user.walletBalance, totalAfterCoupon);
        user.walletBalance -= walletAmountUsed;
        await user.save({ session });

        // Log Wallet Transaction (Spent)
        const [walletTx] = await WalletTransaction.create([{
          userId: user._id,
          amount: walletAmountUsed,
          type: 'spent',
          status: 'completed',
          description: `Used tokens for order payment`,
          domain, // Add domain to transaction
        }], { session });
        
        walletTxId = walletTx._id.toString();
      }

      // Calculate potential rewards (only if already active or this order hits threshold)
      const isAlreadyActive = user.isSubscriptionActive;
      const willBeActive = isAlreadyActive || (totalAfterCoupon >= subConfig.activationThreshold);

      if (willBeActive) {
        // If not already active, activate it now (atomic update)
        if (!isAlreadyActive) {
          user.isSubscriptionActive = true;
          await user.save({ session });
        }
        
        // Calculate reward on the remaining amount paid
        const payableAmount = totalAfterCoupon - walletAmountUsed;
        earnedRewardAmount = Math.floor(payableAmount * (subConfig.rewardPercentage / 100));
      }
    }

    // 6. Create the order
    const [newOrder] = (await Order.create(
      [
        {
          user: user?._id,
          items: validatedItems,
          deliveryCharge: serverComputedDeliveryCharge,
          totalAmount: baseTotal,
          walletAmountUsed,
          couponCode: couponDiscountAmount > 0 ? couponCode?.toUpperCase() : undefined,
          couponDiscountAmount,
          earnedRewardAmount,
          shippingAddress,
          paymentMethod,
          paymentStatus: 'Pending',
          status: 'Order Placed',
          transactionId: paymentMethod === 'Online' ? `ORDER-${crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 16)}` : undefined,
          shortId: crypto.randomBytes(4).toString('hex').toUpperCase(),
          domain, // MUST set the domain
          manualPaymentDetails,
        },
      ],
      { session }
    )) as any;

    // Link transaction to order ID if we had one
    if (walletTxId) {
      await WalletTransaction.findOneAndUpdate(
        { _id: walletTxId, domain },
        { orderId: newOrder._id },
        { session }
      );
    }

    await session.commitTransaction();
    return NextResponse.json(newOrder, { status: 201 });

  } catch (error: any) {
    if (session) {
      await session.abortTransaction();
    }
    console.error('Error creating order (Combo Discount):', error);
    const isClientError = error instanceof StockError;
    return NextResponse.json({ 
        message: isClientError ? error.message : 'Internal Server Error' 
    }, { status: isClientError ? 400 : 500 });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

// GET orders
// If current user is Admin and ?all=true, returns ALL orders
// Otherwise returns only orders for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fetchAll = searchParams.get('all') === 'true';
    const isAdmin = ['admin', 'super_admin'].includes((session.user as any)?.role);

    await connectToDatabase();

    const domain = await getTenantDomain();
    if (!domain) {
      return NextResponse.json({ message: 'Tenant domain is missing' }, { status: 400 });
    }
    let query: any = { domain, deletedAt: null };
    if (fetchAll && isAdmin) {
      // Admins can see all orders for their domain
      query = { domain, deletedAt: null };
    } else {
      // Normal users (or admins without ?all=true) see their own orders on this domain
      const userId = (session.user as any).id;
      if (!userId) {
        return NextResponse.json({ message: 'User ID missing from session' }, { status: 400 });
      }
      query = { user: userId, domain, deletedAt: null };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email'); // Populate user info for admin view

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
