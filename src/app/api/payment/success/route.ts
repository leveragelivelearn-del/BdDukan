import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import { validatePayment } from '@/lib/sslcommerz';

/**
 * Payment Success Callback Handler
 * This route is called by SSLCommerz after a successful payment transaction.
 */
export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const orderId = searchParams.get('id');
    const body = await req.formData();
    const data = Object.fromEntries(body.entries());

    if (!orderId) {
      return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    // Verify Payment with SSLCommerz using native fetch
    const response = await validatePayment(data);

    if (response?.status === 'VALID' || response?.status === 'VALIDATED') {
      await connectToDatabase();
      const { getTenantDomain } = await import('@/lib/tenant');
      const domain = await getTenantDomain();
      if (!domain) {
        return NextResponse.json({ message: 'Tenant domain is missing' }, { status: 400 });
      }
      
      // Atomic update to mark as paid and sales-counted in one go
      // This prevents multiple SSLCommerz callbacks from double-counting sales
      const order = await Order.findOneAndUpdate(
        { _id: orderId, domain, isSalesCounted: { $ne: true } },
        { 
          $set: { 
            paymentStatus: 'Paid', 
            status: 'Confirmed', 
            transactionId: data.tran_id?.toString(),
            isSalesCounted: true 
          } 
        },
        { new: true }
      );

      if (order) {
        // Success: This is the first time we're processing this payment
        try {
          const Product = (await import('@/models/Product')).default;
          for (const item of order.items) {
            await Product.updateOne(
              { _id: item.product, domain: order.domain },
              { $inc: { totalSales: item.quantity } }
            );
          }
        } catch (salesError) {
          console.error('Error updating totalSales on payment success:', salesError);
          // Note: isSalesCounted is already true, so we won't retry this specific part 
          // unless we add more complex logic, but consistency is mostly maintained.
        }
      } else {
        // If findOneAndUpdate returns null, it means isSalesCounted was already true 
        // OR the order ID is invalid. Check if order exists for redirection.
        const existingOrder = await Order.findOne({ _id: orderId, domain });
        if (!existingOrder) {
          return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }
      }

      // Redirect to success page on the same domain
      const origin = req.nextUrl.origin;
      return NextResponse.redirect(`${origin}/checkout/success?id=${orderId}`, 303);
    } else {
      console.error('SSLCommerz Validation Failed:', response);
      const origin = req.nextUrl.origin;
      return NextResponse.redirect(`${origin}/checkout/fail?id=${orderId}&reason=ValidationFailed`, 303);
    }
  } catch (error) {
    console.error('Payment Success Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
