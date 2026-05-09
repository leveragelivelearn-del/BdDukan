import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import FAQ from '@/models/FAQ';
import { auth } from '@/auth';
import { getTenantDomain } from '@/lib/tenant';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const domain = await getTenantDomain();
    if (!domain) {
      return NextResponse.json({ message: 'Tenant domain is missing' }, { status: 400 });
    }
    const faqs = await FAQ.find({ domain }).sort({ order: 1 });
    return NextResponse.json(faqs);
  } catch (error) {
    console.error('Fetch FAQs Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Whitelist allowed fields and prevent operator injection
    const allowedFields = ['question', 'answer', 'order', 'isActive'];
    const sanitizedData: Record<string, any> = {};
    
    for (const key in body) {
      if (
        allowedFields.includes(key) && 
        !key.startsWith('$') && 
        !key.includes('.')
      ) {
        sanitizedData[key] = body[key];
      }
    }

    await connectToDatabase();
    const domain = await getTenantDomain();
    if (!domain) {
      return NextResponse.json({ message: 'Tenant domain is missing' }, { status: 400 });
    }
    
    const faq = await FAQ.create({
        ...sanitizedData,
        domain
    });
    return NextResponse.json(faq, { status: 201 });
  } catch (error) {
    console.error('Create FAQ Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
