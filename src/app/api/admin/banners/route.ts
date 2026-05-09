import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Banner from '@/models/Banner';
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
    const banners = await Banner.find({ domain }).sort({ order: 1 });
    return NextResponse.json(banners);
  } catch (error) {
    console.error('Fetch Banners Error:', error);
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
    await connectToDatabase();
    const domain = await getTenantDomain();
    if (!domain) {
      return NextResponse.json({ message: 'Tenant domain is missing' }, { status: 400 });
    }
    
    const banner = await Banner.create({ ...body, domain });
    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error('Create Banner Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
