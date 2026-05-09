import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getTenantDomain } from '@/lib/tenant';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, address, division, district, thana } = await req.json();

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { message: 'Please provide all required fields.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const domain = await getTenantDomain();
    if (!domain) {
      return NextResponse.json({ message: 'Tenant domain is missing' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail, domain });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email.' },
        { status: 409 }
      );
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone,
      addresses: [{
        street: address,
        division: division,
        state: district,
        city: thana,
        country: 'Bangladesh',
        isDefault: true
      }],
      role: 'user',
      domain: domain, // MUST set domain
    });

    return NextResponse.json(
      { message: 'User registered successfully!', userId: user._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { message: 'Failed to register user.' },
      { status: 500 }
    );
  }
}
