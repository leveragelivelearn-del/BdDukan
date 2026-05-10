import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/db';
import GlobalSettings from '@/models/GlobalSettings';
import { auth } from '@/auth';
import { getTenantDomain } from '@/lib/tenant';

// GET global settings
export async function GET() {
  try {
    await connectToDatabase();
    const domain = await getTenantDomain();
    if (!domain) {
      return NextResponse.json({ message: 'Tenant domain is missing' }, { status: 400 });
    }
    const settings = await GlobalSettings.findOne({ domain }).sort({ updatedAt: -1 });
    if (!settings) {
      return NextResponse.json({
        brandName: process.env.NEXT_PUBLIC_STORE_NAME || "BD Dukan",
        contact: {
          email: "support@bddukan.shop",
          phone: "+8801234567890",
          address: "Dhaka, Bangladesh"
        },
        socialLinks: {
          facebook: '',
          twitter: '',
          instagram: '',
          youtube: '',
          linkedin: '',
          tiktok: '',
          whatsapp: ''
        },
        marqueeText: "Welcome to BD Dukan!",
        metaTitle: process.env.NEXT_PUBLIC_STORE_NAME || "BD Dukan",
        metaDescription: "The most popular online shop in Bangladesh.",
        logoUrl: "/logo.png",
        freeDeliveryThreshold: 0,
        deliveryChargeInsideDhaka: 60,
        deliveryChargeOutsideDhaka: 120,
        uiTemplates: {
          theme: 'green',
          logoFont: 'orbitron',
          bodyFont: 'inter',
        }
      });
    }

    const rawSettings = settings.toObject({ getters: false });
    const maskedSettings = settings.toObject({ getters: true });

    const safeResult = {
      ...maskedSettings,
      facebookAccessToken: (rawSettings.facebookAccessToken || process.env.FACEBOOK_ACCESS_TOKEN) ? "********************" : null,
      courierConfig: maskedSettings.courierConfig ? {
        ...maskedSettings.courierConfig,
        steadfast: rawSettings.courierConfig?.steadfast?.apiKey ? { apiKey: "********************", secretKey: "********************" } : maskedSettings.courierConfig.steadfast,
        pathao: rawSettings.courierConfig?.pathao?.clientId ? { clientId: "********************", clientSecret: "********************", storeId: "********************" } : maskedSettings.courierConfig.pathao,
        redx: rawSettings.courierConfig?.redx?.apiKey ? { apiKey: "********************" } : maskedSettings.courierConfig.redx,
      } : maskedSettings.courierConfig,
      paymentConfig: maskedSettings.paymentConfig ? {
        ...maskedSettings.paymentConfig,
        sslcommerz: rawSettings.paymentConfig?.sslcommerz?.storePassword ? {
          ...maskedSettings.paymentConfig.sslcommerz,
          storePassword: "********************"
        } : maskedSettings.paymentConfig.sslcommerz
      } : maskedSettings.paymentConfig,
      aiConfig: maskedSettings.aiConfig ? {
        ...maskedSettings.aiConfig,
        openRouterApiKey: rawSettings.aiConfig?.openRouterApiKey ? "********************" : null
      } : maskedSettings.aiConfig
    };

    return NextResponse.json(safeResult);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create or update global settings (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !(['admin', 'super_admin'].includes((session.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ message: 'Invalid JSON request body' }, { status: 400 });
    }

    // Whitelist allowed fields for standard admins
    const allowedFields = [
      'brandName', 'contact', 'socialLinks',
      'marqueeText', 'metaTitle', 'metaDescription',
      'subscriptionConfig',
      'freeDeliveryThreshold',
      'deliveryChargeInsideDhaka',
      'deliveryChargeOutsideDhaka',
      'theme',
      'logoUrl',
      'uiTemplates'
    ];

    // Restricted fields - ONLY for super_admin
    const superAdminFields = [
      'uiTemplates',
      'domain',
      'storeId',
      'paymentConfig',
      'googleAnalyticsId',
      'aiConfig',
      'courierConfig',
      'googleTagManagerId',
      'searchConsoleMeta',
      'facebookDomainVerification',
      'metaPixelId',
      'facebookAccessToken',
      'facebookTestEventCode',
      'saasSubscription',
      'manualPaymentConfig'
    ];

    const isSuperAdmin = (session.user as any).role === 'super_admin';
    const allowedBody: any = {};

    Object.keys(body).forEach((key) => {
      if (allowedFields.includes(key)) {
        allowedBody[key] = body[key];
      }
      if (superAdminFields.includes(key) && isSuperAdmin) {
        allowedBody[key] = body[key];
      }
    });

    if (Object.keys(allowedBody).length === 0) {
      return NextResponse.json({ message: 'No valid fields provided for update' }, { status: 400 });
    }

    const domain = await getTenantDomain();
    if (!domain) {
      return NextResponse.json({ message: 'Tenant domain is missing' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if settings already exist for this domain
    let settings = await GlobalSettings.findOne({ domain }).sort({ updatedAt: -1 });
    if (settings) {
      // Update existing settings document manually to trigger setters/encryption
      Object.keys(allowedBody).forEach((key) => {
        (settings as any)[key] = allowedBody[key];
      });
      await settings.save({ validateBeforeSave: false });
    } else {
      // Create new settings record for this domain
      settings = await GlobalSettings.create({ ...allowedBody, domain });
    }

    revalidateTag('settings', 'max');
    revalidateTag('products', 'max');
    revalidateTag('categories', 'max');
    revalidatePath('/', 'layout');
    revalidatePath('/shop', 'page');
    revalidatePath('/blog', 'page');

    // Mask sensitive response data for the return
    const safeResult = {
      ...(settings as any).toObject ? (settings as any).toObject() : settings,
      facebookAccessToken: (settings as any).facebookAccessToken ? "********************" : null
    };

    return NextResponse.json(safeResult, { status: 200 });
  } catch (error: any) {
    console.error('CRITICAL: Error updating settings:', error);
    if (error.name === 'ValidationError') {
      const fieldErrors = Object.keys(error.errors || {}).join(', ');
      return NextResponse.json({
        message: `Validation Error: Missing or invalid fields (${fieldErrors}). Please ensure General Settings are filled.`,
        details: error.errors
      }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
