import { NextRequest, NextResponse } from 'next/server';
import { getCachedSettings } from '@/lib/data-fetching';

const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

export const runtime = 'nodejs'; // Changed from edge to nodejs as crypto module might need it, or we leave it default

async function hashData(data: string): Promise<string> {
  if (!data) return '';
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
  try {
    if (!PIXEL_ID || !ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Missing Facebook config' }, { status: 500 });
    }

    const body = await request.json();
    const { 
      eventName = 'PageView', 
      eventUrl, 
      userAgent, 
      userData = {}, 
      customData: providedCustomData = {},
      testEventCode,
      eventId: providedEventId,
      ...rest
    } = body;

    // Get real client IP
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0';

    const hostname = request.headers.get('host') || 'localhost';
    const settings = await getCachedSettings(hostname).catch(() => null);

    // Merge rest of the body into customData if not already there
    // This handles clients that send parameters in the root instead of inside customData
    const customData = { ...rest, ...providedCustomData };

    // Use provided eventId or fallback to a new one
    const eventId = providedEventId || body.eventId || crypto.randomUUID();

    // Get browser identifiers for better matching
    const fbp = request.cookies.get('_fbp')?.value;
    const fbc = request.cookies.get('_fbc')?.value;

    // Prepare user data for matching
    const rawEmail = userData.email || userData.em;
    const hashedEmail = rawEmail ? await hashData(rawEmail) : undefined;
    
    // Process phone: ensure digits only and has country code (BD: 88)
    const rawPhone = userData.phone || userData.ph;
    let phone = rawPhone ? rawPhone.replace(/\D/g, '') : '';
    if (phone && !phone.startsWith('88')) {
      phone = '88' + phone;
    }
    const hashedPhone = phone ? await hashData(phone) : undefined;
    
    const rawName = userData.name || userData.fn;
    const hashedFirstName = rawName ? await hashData(rawName.split(' ')[0]) : undefined;
    const hashedLastName = (userData.ln || (rawName && rawName.split(' ').slice(1).join(' '))) ? await hashData(userData.ln || rawName.split(' ').slice(1).join(' ')) : undefined;

    const rawCity = userData.city || userData.ct;
    const hashedCity = rawCity ? await hashData(rawCity) : undefined;

    const rawState = userData.state || userData.st;
    const hashedState = rawState ? await hashData(rawState) : undefined;

    const rawZip = userData.zipCode || userData.zp || userData.zip;
    const hashedZip = rawZip ? await hashData(String(rawZip)) : undefined;

    let rawCountry = userData.country || userData.co;
    if (rawCountry) {
      rawCountry = rawCountry.trim().toLowerCase();
      if (rawCountry === 'bangladesh') {
        rawCountry = 'bd';
      }
    } else {
      rawCountry = 'bd'; // Default to BD
    }
    const hashedCountry = await hashData(rawCountry);

    const payload: any = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          event_source_url: eventUrl,
          action_source: 'website',
          user_data: {
            client_ip_address: ipAddress,
            client_user_agent: userAgent,
            fbp,
            fbc,
            em: hashedEmail ? [hashedEmail] : undefined,
            ph: hashedPhone ? [hashedPhone] : undefined,
            fn: hashedFirstName ? [hashedFirstName] : undefined,
            ln: hashedLastName ? [hashedLastName] : undefined,
            ct: hashedCity ? [hashedCity] : undefined,
            st: hashedState ? [hashedState] : undefined,
            zp: hashedZip ? [hashedZip] : undefined,
            country: hashedCountry ? [hashedCountry] : undefined,
          },
          custom_data: customData,
        },
      ],
    };

    // Include test_event_code if provided (for debugging in Events Manager)
    const finalTestEventCode = testEventCode || settings?.facebookTestEventCode || process.env.NEXT_PUBLIC_FACEBOOK_TEST_EVENT_CODE;
    if (finalTestEventCode) {
      payload.test_event_code = finalTestEventCode;
    }

    const fbResponse = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const result = await fbResponse.json();

    if (!fbResponse.ok) {
      console.error('[FB CAPI] Error:', result);
      return NextResponse.json({ error: result }, { status: fbResponse.status });
    }

    return NextResponse.json({ success: true, eventId });
  } catch (error) {
    console.error('[FB CAPI] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
