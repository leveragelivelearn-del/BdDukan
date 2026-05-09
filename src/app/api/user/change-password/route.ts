import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getTenantDomain } from '@/lib/tenant';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Please provide both current and new passwords.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const domain = await getTenantDomain();
    if (!domain) {
      return NextResponse.json({ message: 'Tenant domain is missing' }, { status: 400 });
    }

    const user = await User.findOne({ email: session.user.email, domain }).select('+password');

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }
    
    // Check if user registered via Google and doesn't have a password yet
    if (!user.password && user.googleId) {
        return NextResponse.json({ 
            message: 'Your account uses Google Login. You cannot change a password here.' 
        }, { status: 400 });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password as string);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Incorrect current password.' },
        { status: 400 }
      );
    }

    // Set new password, User schema pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    return NextResponse.json(
      { message: 'Password updated successfully!' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { message: 'Failed to update password.' },
      { status: 500 }
    );
  }
}
