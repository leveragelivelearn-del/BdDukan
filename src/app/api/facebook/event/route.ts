import { NextRequest, NextResponse } from 'next/server';
import { getCachedSettings } from '@/lib/data-fetching';
import { headers } from 'next/headers';
import crypto from 'crypto';

// Helper to hash PII (Personally Identifiable Information)
const sha256 = (text: string | undefined | null) => {
    if (!text) return undefined;
    return crypto
        .createHash('sha256')
        .update(text.trim().toLowerCase())
        .digest('hex');
};

// Normalize phone number (Remove non-digits and ensure Bangladesh country code)
const normalizePhone = (phone: string | undefined | null) => {
    if (!phone) return undefined;
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '88' + cleaned;
    } else if (cleaned.startsWith('1')) {
        cleaned = '880' + cleaned;
    }
    return sha256(cleaned);
};

export async function POST(request: NextRequest) {
    try {
        const headersList = await headers();
        const hostname = headersList.get('host') || 'localhost';
        const settings = await getCachedSettings(hostname);

        const pixelId = settings?.metaPixelId || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
        const accessToken = settings?.facebookAccessToken || process.env.FACEBOOK_ACCESS_TOKEN;
        const testCode = settings?.facebookTestEventCode || process.env.FACEBOOK_TEST_EVENT_CODE;

        if (!pixelId || !accessToken) {
            return NextResponse.json({ error: 'Missing Facebook configuration' }, { status: 500 });
        }

        const body = await request.json();
        const { eventName, eventUrl, userAgent, eventId, customData, userData } = body;

        // Get real client IP
        const ipAddress =
            request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            request.headers.get('x-real-ip') ||
            '0.0.0.0';

        // Calculate hashed values
        const hashedEmail = sha256(userData?.em);
        const hashedPhone = normalizePhone(userData?.ph);
        const hashedFirstName = sha256(userData?.fn);
        const hashedLastName = sha256(userData?.ln);

        // Prepare User Data with Hashing
        const hashedUserData: any = {
            client_ip_address: ipAddress,
            client_user_agent: userAgent,
            fbp: userData?.fbp || request.cookies.get('_fbp')?.value,
            fbc: userData?.fbc || request.cookies.get('_fbc')?.value,
            ...(hashedEmail && { em: [hashedEmail] }),
            ...(hashedPhone && { ph: [hashedPhone] }),
            ...(hashedFirstName && { fn: [hashedFirstName] }),
            ...(hashedLastName && { ln: [hashedLastName] }),
        };

        const payload: any = {
            data: [
                {
                    event_name: eventName,
                    event_time: Math.floor(Date.now() / 1000),
                    event_id: eventId,
                    event_source_url: eventUrl,
                    action_source: 'website',
                    user_data: hashedUserData,
                    custom_data: customData,
                },
            ],
        };

        // Add test event code if provided
        if (testCode) {
            payload.test_event_code = testCode;
        }

        const fbResponse = await fetch(
            `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );

        const result = await fbResponse.json();

        if (!fbResponse.ok) {
            console.error('[FB CAPI Error]', result);
            return NextResponse.json({ error: 'Facebook CAPI Failed', details: result }, { status: fbResponse.status });
        }

        return NextResponse.json({ success: true, eventId });
    } catch (error: any) {
        console.error('[FB CAPI Unexpected Error]', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
