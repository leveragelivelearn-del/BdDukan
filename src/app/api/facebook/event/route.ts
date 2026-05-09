import { NextRequest, NextResponse } from 'next/server';
import { getCachedSettings } from '@/lib/data-fetching';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const headersList = await headers();
        const hostname = headersList.get('host') || 'localhost';
        const settings = await getCachedSettings(hostname);

        const pixelId = settings?.metaPixelId || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
        const accessToken = settings?.facebookAccessToken || process.env.FACEBOOK_ACCESS_TOKEN;

        if (!pixelId || !accessToken) {
            console.error('[FB CAPI] Missing configuration for', hostname);
            return NextResponse.json({ error: 'Missing Facebook config' }, { status: 500 });
        }

        const body = await request.json();
        const { eventName = 'PageView', eventUrl, userAgent } = body;


        // Get real client IP
        const ipAddress =
            request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            request.headers.get('x-real-ip') ||
            '0.0.0.0';

        // Generate/Use event ID for deduplication
        const eventId = body.eventId || crypto.randomUUID();

        // Get browser identifiers for best match quality
        const fbp = request.cookies.get('_fbp')?.value;
        const fbc = request.cookies.get('_fbc')?.value;

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
                    },
                },
            ],
        };


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
            console.error('[FB CAPI] Error:', result);
            return NextResponse.json(
                { error: 'Failed to send event to Facebook', details: result },
                { status: fbResponse.status }
            );
        }

        return NextResponse.json({ success: true, eventId });
    } catch (error) {
        console.error('[FB CAPI] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
