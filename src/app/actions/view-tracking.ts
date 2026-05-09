'use server'

import connectToDatabase from '@/lib/db';
import Blog from '@/models/Blog';
import Product from '@/models/Product';
import { getTenantDomain } from '@/lib/tenant';

export async function trackView(id: string, type: 'product' | 'blog') {
  try {
    await connectToDatabase();
    const domain = await getTenantDomain();
    
    if (type === 'blog') {
      await Blog.updateOne({ _id: id, domain }, { $inc: { views: 1 } });
    } else if (type === 'product') {
      await Product.updateOne({ _id: id, domain }, { $inc: { views: 1 } });
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error tracking ${type} view:`, error);
    return { success: false };
  }
}
