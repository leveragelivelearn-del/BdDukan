import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGlobalSettings extends Document {
  brandName: string;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  logoUrl?: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  marqueeText?: string;
  freeDeliveryThreshold?: number;
  deliveryChargeInsideDhaka?: number;
  deliveryChargeOutsideDhaka?: number;
  metaTitle?: string;
  metaDescription?: string;
  googleTagManagerId?: string;
  searchConsoleMeta?: string;
  facebookDomainVerification?: string;
  metaPixelId?: string;
  facebookAccessToken?: string;
  facebookTestEventCode?: string;
  courierConfig?: {
    activeProvider?: 'steadfast' | 'pathao' | 'redx' | 'none';
    steadfast?: {
      apiKey: string;
      secretKey: string;
    };
    pathao?: {
      clientId: string;
      clientSecret: string;
      storeId: string;
    };
    redx?: {
      apiKey: string;
    };
  };
  subscriptionConfig: {
    activationThreshold: number;
    rewardPercentage: number;
  };
  domain: string; // The primary domain for this tenant (e.g., customer-shop.com)
  storeId: string; // Unique identifier for the store
  paymentConfig?: {
    activeMethod: 'sslcommerz' | 'none';
    sslcommerz?: {
      storeId: string;
      storePassword: string;
      isSandbox: boolean;
    };
  };
  googleAnalyticsId?: string; // GA4 Property ID
  googleSearchConsoleId?: string; // Search Console Site URL (e.g. https://www.example.com/ or sc-domain:example.com)
  aiConfig?: {
    openRouterApiKey?: string;
    systemPrompt?: string;
  };
  uiTemplates: {
    layout: string;
    navbar: string;
    hero: string;
    categories: string;
    productCard: string;
    productDetail: string;
    blogDetail: string;
    shopListing: string;
    blogListing: string;
    footer: string;
    theme: string;
    logoFont: string;
    bodyFont: string;
  };
  saasSubscription?: {
    expiryDate: Date;
    status: 'Active' | 'Expired' | 'Suspended';
  };
  createdAt: Date;
  updatedAt: Date;
}

import { encrypt, decrypt } from '@/lib/encryption';

const GlobalSettingsSchema: Schema<IGlobalSettings> = new Schema(
  {
    brandName: { type: String },
    contact: {
      email: { type: String },
      phone: { type: String },
      address: { type: String },
    },
    logoUrl: { type: String, default: '/logo.png' },
    socialLinks: {
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      youtube: { type: String },
      linkedin: { type: String },
      tiktok: { type: String },
      whatsapp: { type: String },
    },
    marqueeText: { type: String },
    freeDeliveryThreshold: { type: Number, default: 0 },
    deliveryChargeInsideDhaka: { type: Number, default: 60 },
    deliveryChargeOutsideDhaka: { type: Number, default: 120 },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    googleTagManagerId: { type: String },
    searchConsoleMeta: { type: String },
    facebookDomainVerification: { type: String },
    metaPixelId: { type: String },
    facebookAccessToken: { type: String, get: decrypt, set: encrypt },
    facebookTestEventCode: { type: String },
    courierConfig: {
      activeProvider: { type: String, enum: ['steadfast', 'pathao', 'redx', 'none'], default: 'none' },
      steadfast: {
        apiKey: { type: String, get: decrypt, set: encrypt },
        secretKey: { type: String, get: decrypt, set: encrypt },
      },
      pathao: {
        clientId: { type: String, get: decrypt, set: encrypt },
        clientSecret: { type: String, get: decrypt, set: encrypt },
        storeId: { type: String, get: decrypt, set: encrypt },
      },
      redx: {
        apiKey: { type: String, get: decrypt, set: encrypt },
      },
    },
    subscriptionConfig: {
      activationThreshold: { type: Number, default: 5000 },
      rewardPercentage: { type: Number, default: 5 },
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      index: true,
      unique: true,
      trim: true,
      lowercase: true,
      default: 'janopriyo.com'
    },
    storeId: { type: String, required: false, unique: false }, // Will be set to required: true, unique: true after migration
    paymentConfig: {
      activeMethod: { type: String, enum: ['sslcommerz', 'none'], default: 'none' },
      sslcommerz: {
        storeId: { type: String, get: decrypt, set: encrypt },
        storePassword: { type: String, get: decrypt, set: encrypt },
        isSandbox: { type: Boolean, default: true }
      }
    },
    googleAnalyticsId: { type: String },
    googleSearchConsoleId: { type: String },
    aiConfig: {
      openRouterApiKey: { type: String, get: decrypt, set: encrypt },
      systemPrompt: { type: String, default: 'You are a helpful e-commerce assistant.' }
    },
    uiTemplates: {
      layout: { type: String, default: 'fashion' },
      navbar: { type: String, default: 'v1' },
      hero: { type: String, default: 'v1' },
      categories: { type: String, default: 'v1' },
      productCard: { type: String, default: 'v1' },
      productDetail: { type: String, default: 'v1' },
      blogDetail: { type: String, default: 'v1' },
      shopListing: { type: String, default: 'v1' },
      blogListing: { type: String, default: 'v1' },
      footer: { type: String, default: 'v1' },
      theme: { type: String, default: 'green' },
      logoFont: { type: String, default: 'orbitron' },
      bodyFont: { type: String, default: 'inter' },
    },
    saasSubscription: {
      expiryDate: { type: Date, required: true, index: true },
      status: { type: String, enum: ['Active', 'Expired', 'Suspended'], default: 'Active' },
    },
  },
  {
    timestamps: true,
    toJSON: {
      getters: false, // Prevent automatic decryption and exposure in API responses
      transform: (doc, ret) => {
        // Security: Explicitly remove sensitive courier credentials from serialized output
        if (ret.courierConfig) {
          delete ret.courierConfig.steadfast;
          delete ret.courierConfig.pathao;
          delete ret.courierConfig.redx;
        }
        // Security: Remove sensitive Payment credentials
        if (ret.paymentConfig) {
          delete ret.paymentConfig.sslcommerz;
        }
        // Security: Remove sensitive AI API Key
        if (ret.aiConfig) {
          delete ret.aiConfig.openRouterApiKey;
        }
        // Security: Remove sensitive Facebook Access Token
        delete ret.facebookAccessToken;
        return ret;
      }
    },
    toObject: { getters: true } // Keep getters enabled for internal server-side logic
  }
);

const GlobalSettings: Model<IGlobalSettings> =
  mongoose.models.GlobalSettings || mongoose.model<IGlobalSettings>('GlobalSettings', GlobalSettingsSchema);

export default GlobalSettings;
