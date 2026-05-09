'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Layout, 
  Palette, 
  Monitor, 
  Save, 
  ShieldCheck,
  ChevronRight,
  Eye,
  Globe,
  CreditCard,
  BarChart3,
  Truck,
  Settings2,
  Code
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from '@/components/ui/image-upload';



const TEMPLATE_OPTIONS = ['v1', 'v2', 'v3', 'v4', 'v5'];
const THEME_OPTIONS = ['default', 'black', 'caffeine', 'claude', 'elegant', 'marvel', 'material', 'midnight', 'nature', 'perplexity', 'slack', 'summer', 'sunset', 'valorant', 'supabase', 'amber', 'catppuccin', 'clay', 'cyberpunk', 'darkmatter', 'ocean', 'quantum', 't3', 'tangerine', 'vintage', 'green', 'red', 'rose', 'orange', 'blue', 'yellow', 'violet'];

const TEMPLATE_CONFIG = [
  { id: 'layout', label: 'Primary Layout' },
  { id: 'navbar', label: 'Navbar' },
  { id: 'hero', label: 'Hero Section' },
  { id: 'productCard', label: 'Product Card' },
  { id: 'productDetail', label: 'Product Detail' },
  { id: 'categories', label: 'Category View' },
  { id: 'footer', label: 'Footer' },
  { id: 'shopListing', label: 'Shop Page' },
  { id: 'blogListing', label: 'Blog Listing' },
  { id: 'blogDetail', label: 'Blog Detail' },
];

const FONT_OPTIONS = [
  { id: 'inter', label: 'Inter (Modern Sans)' },
  { id: 'poppins', label: 'Poppins (Round Sans)' },
  { id: 'roboto', label: 'Roboto (Clean Sans)' },
  { id: 'montserrat', label: 'Montserrat (Elegant Sans)' },
  { id: 'playfair', label: 'Playfair Display (Serif)' },
  { id: 'lora', label: 'Lora (Classic Serif)' },
  { id: 'outfit', label: 'Outfit (Contemporary Sans)' },
  { id: 'urbanist', label: 'Urbanist (Geometric Sans)' },
  { id: 'manrope', label: 'Manrope (Modern Humanist)' },
  { id: 'open-sans', label: 'Open Sans (Neutral Sans)' },
  { id: 'lato', label: 'Lato (Friendly Sans)' },
  { id: 'oswald', label: 'Oswald (Strong/Logo)' },
  { id: 'raleway', label: 'Raleway (Elegant Sans)' },
  { id: 'nunito', label: 'Nunito (Soft Round)' },
  { id: 'ubuntu', label: 'Ubuntu (Technical Sans)' },
  { id: 'merriweather', label: 'Merriweather (Bold Serif)' },
  { id: 'kanit', label: 'Kanit (Modern Thai/Bold)' },
  { id: 'quicksand', label: 'Quicksand (Playful Round)' },
  { id: 'josefin-sans', label: 'Josefin Sans (Geometric/Logo)' },
  { id: 'syne', label: 'Syne (Artistic/Trendy)' },
  { id: 'space-grotesk', label: 'Space Grotesk (Futuristic/Tech)' },
  { id: 'orbitron', label: 'Orbitron (Futuristic)' },
  { id: 'geist', label: 'Geist (Next.js Default)' },
];

export default function SuperConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to load settings: ${res.status}`);
      }
      const data = await res.json();
      setSettings(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!settings) {
      toast.error('No settings data available to save');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success('SaaS Infrastructure Configured Successfully!');
        router.refresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Update failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = (key: string, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      uiTemplates: {
        ...(settings.uiTemplates || {}),
        [key]: value
      }
    });
  };

  const updateGeneralSetting = (key: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  const handleRepair = async () => {
    if (!confirm('This will sync all orphaned data (products, orders, etc.) to the current domain. Continue?')) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/admin/seed/repair-tenants', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Repair Complete! ${data.results.products} products and ${data.results.orders} orders synced.`);
        router.refresh();
      } else {
        throw new Error(data.message || 'Repair failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to repair database');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
    </div>
  );

  const ui = settings?.uiTemplates || {};

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
            <ShieldCheck className="h-4 w-4" /> Global Infrastructure Control
          </div>
          <h1 className="text-4xl font-black tracking-tighter">Tenant Deep Config</h1>
          <p className="text-muted-foreground">Manage keys, tracking, and logistics for this specific domain.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={handleRepair} 
            disabled={saving || !settings}
            className="h-12 px-6 rounded-xl font-bold gap-2 border-2"
          >
            {saving ? 'Repairing...' : 'Repair Database'}
          </Button>
          <Button 
            onClick={handleUpdate} 
            disabled={saving || !settings}
            className="h-12 px-8 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20"
          >
            {saving ? 'Applying...' : <><Save className="h-5 w-5" /> Save SaaS Config</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Brand Identity (Spans 2 columns) */}
        <div className="lg:col-span-2">
          <Card className="h-full border-none shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white pb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Settings2 className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Brand Identity & Typography</CardTitle>
                  <CardDescription className="text-orange-100">Configure your brand name, logo and fonts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Brand Name */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-orange-500" />
                    Brand Name
                  </Label>
                  <input 
                    type="text"
                    value={settings?.brandName || ''}
                    onChange={(e) => updateGeneralSetting('brandName', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-orange-500 focus:ring-0 transition-all outline-none"
                    placeholder="Enter brand name"
                  />
                </div>

                {/* Logo Upload */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-orange-500" />
                    Store Logo
                  </Label>
                  <div className="flex items-center gap-4">
                    {settings?.logoUrl && (
                      <div className="h-12 w-12 rounded-xl border bg-white p-1 flex items-center justify-center overflow-hidden shrink-0">
                        <img src={settings.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                    <div className="flex-1">
                      <ImageUpload 
                        onUpload={(url) => updateGeneralSetting('logoUrl', url)} 
                        className="h-12 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo Font */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Code className="w-4 h-4 text-orange-500" />
                    Logo Typography
                  </Label>
                  <Select 
                    value={settings?.uiTemplates?.logoFont || 'orbitron'} 
                    onValueChange={(v) => updateTemplate('logoFont', v)}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-orange-500 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl min-w-[300px] max-h-[450px] shadow-2xl border-2 border-orange-500/10">
                      {FONT_OPTIONS.map(f => (
                        <SelectItem key={f.id} value={f.id} className="rounded-xl py-3 focus:bg-orange-50 transition-colors">
                          <span className="font-medium text-sm">{f.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Body Font */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Layout className="w-4 h-4 text-orange-500" />
                    Body Typography
                  </Label>
                  <Select 
                    value={settings?.uiTemplates?.bodyFont || 'inter'} 
                    onValueChange={(v) => updateTemplate('bodyFont', v)}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-orange-500 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl min-w-[300px] max-h-[450px] shadow-2xl border-2 border-orange-500/10">
                      {FONT_OPTIONS.map(f => (
                        <SelectItem key={f.id} value={f.id} className="rounded-xl py-3 focus:bg-orange-50 transition-colors">
                          <span className="font-medium text-sm">{f.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: SaaS Subscription Control (Spans 1 column) */}
        <div className="lg:col-span-1">
          <Card className="h-full border-2 border-red-500/20 shadow-none overflow-hidden rounded-3xl bg-white/50 backdrop-blur-sm">
            <CardHeader className="bg-red-500/5 border-b">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <CreditCard className="h-5 w-5" /> Subscription Control
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sub-expiry" className="font-bold text-xs text-gray-600">Expiry Date & Time</Label>
                  <input 
                    id="sub-expiry" 
                    type="datetime-local" 
                    value={(() => {
                      if (!settings?.saasSubscription?.expiryDate) return '';
                      const date = new Date(settings.saasSubscription.expiryDate);
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const hours = String(date.getHours()).padStart(2, '0');
                      const minutes = String(date.getMinutes()).padStart(2, '0');
                      return `${year}-${month}-${day}T${hours}:${minutes}`;
                    })()}
                    onChange={(e) => {
                      const localDate = new Date(e.target.value);
                      setSettings({
                        ...(settings ?? {}), 
                        saasSubscription: {
                          ...(settings?.saasSubscription || {}),
                          expiryDate: localDate.toISOString()
                        }
                      });
                    }} 
                    className="w-full h-12 rounded-xl border-2 bg-white px-4 text-sm focus:border-red-500 outline-none transition-all" 
                  />
                  <p className="text-[10px] text-muted-foreground italic">Set when the tenant's access will automatically expire.</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-gray-600">Access Status</Label>
                  <Select 
                    value={settings?.saasSubscription?.status || 'Active'} 
                    onValueChange={(v) => setSettings({
                      ...settings, 
                      saasSubscription: {
                        ...(settings?.saasSubscription || {}),
                        status: v
                      }
                    })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 bg-white focus:border-red-500 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Active">Active (Live)</SelectItem>
                      <SelectItem value="Expired">Expired (Blocked)</SelectItem>
                      <SelectItem value="Suspended">Suspended (Manual Block)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        {/* 1. Tenant Identification */}
        <Card className="lg:col-span-3 border-2 border-primary/20 shadow-none overflow-hidden rounded-3xl">
           <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2">
                 <Globe className="h-5 w-5 text-primary" /> Core Identity
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="space-y-2">
                <Label htmlFor="store-domain" className="font-bold">Store Domain</Label>
                <input 
                  id="store-domain"
                  value={settings?.domain || ''} 
                  onChange={(e) => setSettings({...(settings ?? {}), domain: e.target.value})}
                  className="w-full h-12 rounded-xl border px-4 focus:ring-2 focus:ring-primary outline-none text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant-store-id" className="font-bold">Tenant Store ID</Label>
                <input 
                  id="tenant-store-id"
                  value={settings?.storeId || ''} 
                  onChange={(e) => setSettings({...(settings ?? {}), storeId: e.target.value})}
                  className="w-full h-12 rounded-xl border px-4 focus:ring-2 focus:ring-primary outline-none text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gtm-id" className="font-bold">GTM ID (Tag Manager)</Label>
                <input 
                  id="gtm-id"
                  value={settings?.googleTagManagerId || ''} 
                  onChange={(e) => setSettings({...(settings ?? {}), googleTagManagerId: e.target.value})}
                  placeholder="GTM-XXXXXXX"
                  className="w-full h-12 rounded-xl border px-4 focus:ring-2 focus:ring-primary outline-none text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ga4-id" className="font-bold">GA4 Property ID</Label>
                <input 
                  id="ga4-id"
                  value={settings?.googleAnalyticsId || ''} 
                  onChange={(e) => setSettings({...(settings ?? {}), googleAnalyticsId: e.target.value})}
                  placeholder="e.g. 534447077"
                  className="w-full h-12 rounded-xl border px-4 focus:ring-2 focus:ring-primary outline-none text-sm"
                />
              </div>
           </CardContent>
        </Card>

        {/* 2. SEO & Tracking */}
        <Card className="lg:col-span-3 border-2 shadow-none overflow-hidden rounded-3xl">
           <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                 <BarChart3 className="h-5 w-5 text-primary" /> Advanced Tracking
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6 space-y-6">
               <div className="space-y-2">
                <Label htmlFor="meta-pixel-id" className="font-bold text-xs">Meta Pixel ID</Label>
                <input id="meta-pixel-id" value={settings?.metaPixelId || ''} onChange={(e) => setSettings({...settings, metaPixelId: e.target.value})} className="w-full h-12 rounded-xl border px-4 text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fb-access-token" className="font-bold text-xs">Facebook Access Token</Label>
                <input id="fb-access-token" type="password" value={settings?.facebookAccessToken || ''} onChange={(e) => setSettings({...settings, facebookAccessToken: e.target.value})} className="w-full h-12 rounded-xl border px-4 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fb-domain-verify" className="font-bold text-xs">FB Domain Verification</Label>
                  <input id="fb-domain-verify" value={settings?.facebookDomainVerification || ''} onChange={(e) => setSettings({...settings, facebookDomainVerification: e.target.value})} className="w-full h-12 rounded-xl border px-4 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-test-code" className="font-bold text-xs">FB Test Event Code</Label>
                  <input id="fb-test-code" value={settings?.facebookTestEventCode || ''} onChange={(e) => setSettings({...settings, facebookTestEventCode: e.target.value})} className="w-full h-12 rounded-xl border px-4 text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sc-api-url" className="font-bold text-xs">Search Console ID / URL (for Analytics)</Label>
                <input id="sc-api-url" value={settings?.googleSearchConsoleId || ''} onChange={(e) => setSettings({...settings, googleSearchConsoleId: e.target.value})} placeholder="e.g. https://www.example.com/ or sc-domain:example.com" className="w-full h-12 rounded-xl border px-4 text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-console-meta" className="font-bold text-xs">Search Console Meta Tag (for Verification)</Label>
                <input id="search-console-meta" value={settings?.searchConsoleMeta || ''} onChange={(e) => setSettings({...settings, searchConsoleMeta: e.target.value})} className="w-full h-12 rounded-xl border px-4 text-sm" />
              </div>
           </CardContent>
        </Card>

        {/* 3. AI Intelligence */}
        <Card className="lg:col-span-3 border-2 border-purple-500/20 shadow-none overflow-hidden rounded-3xl">
           <CardHeader className="bg-purple-500/5 border-b">
              <CardTitle className="flex items-center gap-2">
                 <Settings2 className="h-5 w-5 text-purple-600" /> AI Bot Configuration
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6 space-y-6">
               <div className="space-y-2">
                <Label htmlFor="openrouter-api-key" className="font-bold text-xs">OpenRouter API Key</Label>
                <input id="openrouter-api-key" type="password" value={settings?.aiConfig?.openRouterApiKey || ''} onChange={(e) => setSettings({...settings, aiConfig: {...(settings?.aiConfig || {}), openRouterApiKey: e.target.value}})} className="w-full h-12 rounded-xl border px-4 text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="system-prompt" className="font-bold text-xs">System Training Prompt</Label>
                <textarea id="system-prompt" value={settings?.aiConfig?.systemPrompt || ''} onChange={(e) => setSettings({...settings, aiConfig: {...(settings?.aiConfig || {}), systemPrompt: e.target.value}})} className="w-full h-24 rounded-xl border p-4 text-sm resize-none" />
              </div>
           </CardContent>
        </Card>

         {/* 4. Courier Logistics */}
        <Card className="lg:col-span-3 border-2 border-orange-500/20 shadow-none overflow-hidden rounded-3xl">
           <CardHeader className="bg-orange-500/5 border-b">
              <CardTitle className="flex items-center gap-2">
                 <Truck className="h-5 w-5 text-orange-600" /> Courier & Shipping Rules
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Active Provider</Label>
                    <Select value={settings?.courierConfig?.activeProvider || 'none'} onValueChange={(v) => setSettings({...settings, courierConfig: {...(settings?.courierConfig || {}), activeProvider: v}})}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="steadfast">Steadfast</SelectItem>
                        <SelectItem value="pathao">Pathao</SelectItem>
                        <SelectItem value="redx">RedX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inside-dhaka" className="font-bold">Inside Dhaka (TK)</Label>
                    <input id="inside-dhaka" type="number" value={settings?.deliveryChargeInsideDhaka || 0} onChange={(e) => setSettings({...settings, deliveryChargeInsideDhaka: Number(e.target.value)})} className="w-full h-12 rounded-xl border px-4" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="outside-dhaka" className="font-bold">Outside Dhaka (TK)</Label>
                    <input id="outside-dhaka" type="number" value={settings?.deliveryChargeOutsideDhaka || 0} onChange={(e) => setSettings({...settings, deliveryChargeOutsideDhaka: Number(e.target.value)})} className="w-full h-12 rounded-xl border px-4" />
                  </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border">
                 <div className="md:col-span-2 font-black text-xs uppercase opacity-50 mb-2">Provider Credentials</div>
                  <div className="space-y-2">
                    <Label htmlFor="steadfast-api-key" className="font-bold text-xs">Steadfast API Key</Label>
                    <input id="steadfast-api-key" type="password" value={settings?.courierConfig?.steadfast?.apiKey || ''} onChange={(e) => setSettings({...settings, courierConfig: {...(settings?.courierConfig || {}), steadfast: {...(settings?.courierConfig?.steadfast || {}), apiKey: e.target.value}}})} className="w-full h-10 rounded-lg border px-3 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pathao-store-id" className="font-bold text-xs">Pathao Store ID</Label>
                    <input id="pathao-store-id" value={settings?.courierConfig?.pathao?.storeId || ''} onChange={(e) => setSettings({...settings, courierConfig: {...(settings?.courierConfig || {}), pathao: {...(settings?.courierConfig?.pathao || {}), storeId: e.target.value}}})} className="w-full h-10 rounded-lg border px-3 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="redx-api-key" className="font-bold text-xs">RedX API Key</Label>
                    <input id="redx-api-key" type="password" value={settings?.courierConfig?.redx?.apiKey || ''} onChange={(e) => setSettings({...settings, courierConfig: {...(settings?.courierConfig || {}), redx: {...(settings?.courierConfig?.redx || {}), apiKey: e.target.value}}})} className="w-full h-10 rounded-lg border px-3 text-xs" />
                  </div>
              </div>
           </CardContent>
        </Card>

        {/* 5. Payment Gateway Configuration */}
        <Card className="lg:col-span-3 border-2 border-blue-500/20 shadow-none overflow-hidden rounded-3xl">
           <CardHeader className="bg-blue-500/5 border-b">
              <CardTitle className="flex items-center gap-2">
                 <CreditCard className="h-5 w-5 text-blue-600" /> Payment Gateway (SSLCommerz)
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Active Payment Method</Label>
                    <Select 
                      value={settings?.paymentConfig?.activeMethod || 'none'} 
                      onValueChange={(v) => setSettings({
                        ...settings, 
                        paymentConfig: {
                          ...(settings?.paymentConfig || {}), 
                          activeMethod: v
                        }
                      })}
                    >
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Cash on Delivery Only)</SelectItem>
                        <SelectItem value="sslcommerz">SSLCommerz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-4">
                    <input 
                      type="checkbox" 
                      id="is-sandbox"
                      checked={settings?.paymentConfig?.sslcommerz?.isSandbox ?? true}
                      onChange={(e) => setSettings({
                        ...settings, 
                        paymentConfig: {
                          ...(settings?.paymentConfig || {}),
                          sslcommerz: {
                            ...(settings?.paymentConfig?.sslcommerz || {}),
                            isSandbox: e.target.checked
                          }
                        }
                      })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="is-sandbox" className="font-bold text-sm">Enable Sandbox Mode</Label>
                  </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border">
                 <div className="md:col-span-2 font-black text-xs uppercase opacity-50 mb-2">SSLCommerz Credentials</div>
                  <div className="space-y-2">
                    <Label htmlFor="ssl-store-id" className="font-bold text-xs">Store ID</Label>
                    <input 
                      id="ssl-store-id" 
                      value={settings?.paymentConfig?.sslcommerz?.storeId || ''} 
                      onChange={(e) => setSettings({
                        ...settings, 
                        paymentConfig: {
                          ...(settings?.paymentConfig || {}),
                          sslcommerz: {
                            ...(settings?.paymentConfig?.sslcommerz || {}),
                            storeId: e.target.value
                          }
                        }
                      })} 
                      className="w-full h-10 rounded-lg border px-3 text-xs" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssl-store-passwd" className="font-bold text-xs">Store Password</Label>
                    <input 
                      id="ssl-store-passwd" 
                      type="password"
                      value={settings?.paymentConfig?.sslcommerz?.storePassword || ''} 
                      onChange={(e) => setSettings({
                        ...settings, 
                        paymentConfig: {
                          ...(settings?.paymentConfig || {}),
                          sslcommerz: {
                            ...(settings?.paymentConfig?.sslcommerz || {}),
                            storePassword: e.target.value
                          }
                        }
                      })} 
                      className="w-full h-10 rounded-lg border px-3 text-xs" 
                      placeholder="Enter Password"
                    />
                  </div>
              </div>
           </CardContent>
        </Card>

        {/* 6. Manual Payment Configuration (Mobile Banking) */}
        <Card className="lg:col-span-3 border-2 border-pink-500/20 shadow-none overflow-hidden rounded-3xl">
           <CardHeader className="bg-pink-500/5 border-b">
              <CardTitle className="flex items-center gap-2">
                 <CreditCard className="h-5 w-5 text-pink-600" /> Manual Payment (Mobile Banking)
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {['bkash', 'nagad', 'rocket'].map((method) => (
                  <div key={method} className="space-y-4 p-4 rounded-2xl border bg-muted/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={`/assets/${method}logo.webp`} alt={method} className="h-6 w-6 object-contain" />
                        <Label className="font-bold capitalize">{method}</Label>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings?.manualPaymentConfig?.[method]?.active ?? false}
                        onChange={(e) => setSettings({
                          ...settings,
                          manualPaymentConfig: {
                            ...(settings?.manualPaymentConfig || {}),
                            [method]: {
                              ...(settings?.manualPaymentConfig?.[method] || {}),
                              active: e.target.checked
                            }
                          }
                        })}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase opacity-60">Number</Label>
                      <input 
                        type="text"
                        value={settings?.manualPaymentConfig?.[method]?.number || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          manualPaymentConfig: {
                            ...(settings?.manualPaymentConfig || {}),
                            [method]: {
                              ...(settings?.manualPaymentConfig?.[method] || {}),
                              number: e.target.value
                            }
                          }
                        })}
                        placeholder="017XXXXXXXX"
                        className="w-full h-10 rounded-lg border px-3 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase opacity-60">QR Code URL</Label>
                      <input 
                        type="text"
                        value={settings?.manualPaymentConfig?.[method]?.qrCode || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          manualPaymentConfig: {
                            ...(settings?.manualPaymentConfig || {}),
                            [method]: {
                              ...(settings?.manualPaymentConfig?.[method] || {}),
                              qrCode: e.target.value
                            }
                          }
                        })}
                        placeholder="https://imgbb.com/..."
                        className="w-full h-10 rounded-lg border px-3 text-sm text-[10px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Payment Instructions</Label>
                <textarea 
                  value={settings?.manualPaymentConfig?.instructions || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    manualPaymentConfig: {
                      ...(settings?.manualPaymentConfig || {}),
                      instructions: e.target.value
                    }
                  })}
                  className="w-full h-24 rounded-xl border p-4 text-sm resize-none"
                  placeholder="Instructions for the user..."
                />
              </div>
           </CardContent>
        </Card>


        {/* 6. Layout & Templates */}
        <Card className="lg:col-span-3 border-2 border-primary/10 shadow-none overflow-hidden rounded-3xl">
           <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2 text-primary">
                 <Layout className="h-5 w-5" /> Design Orchestration
              </CardTitle>
              <CardDescription>Select the active version for each UI component across the platform.</CardDescription>
           </CardHeader>
           <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {TEMPLATE_CONFIG.map((template) => (
                 <div key={template.id} className="space-y-2">
                   <Label className="font-bold text-[10px] uppercase tracking-wider opacity-60">{template.label}</Label>
                   <Select 
                     value={ui[template.id] ?? 'v1'} 
                     onValueChange={(v) => updateTemplate(template.id, v)}
                   >
                     <SelectTrigger className="h-12 rounded-xl bg-background border-2 border-muted hover:border-primary/50 transition-colors">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl">
                       {TEMPLATE_OPTIONS.map(o => (
                         <SelectItem key={o} value={o} className="rounded-lg">
                           Version {o.toUpperCase()}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               ))}
               
                {/* Theme Selector */}
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider opacity-60 text-primary">Active Brand Theme</Label>
                  <Select 
                    value={ui.theme ?? 'default'} 
                    onValueChange={(v) => updateTemplate('theme', v)}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-primary/5 border-2 border-primary/20 hover:border-primary transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl min-w-[300px] max-h-[450px] shadow-2xl border-2 border-primary/10">
                      {THEME_OPTIONS.map(t => (
                        <SelectItem key={t} value={t} className="rounded-xl py-3 capitalize focus:bg-primary/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full bg-primary/20 border border-primary/30" />
                            <span className="font-medium text-sm">
                              {t === 'default' ? 'Default (System)' : t === 'black' ? 'Black and White Theme' : t === 'caffeine' ? 'Caffeine Theme' : t === 'claude' ? 'Claude Theme' : t === 'elegant' ? 'Elegant Luxury Theme' : t === 'marvel' ? 'Marvel Theme' : t === 'material' ? 'Material Design Theme' : t === 'midnight' ? 'Midnight Bloom Theme' : t === 'nature' ? 'Nature Theme' : t === 'perplexity' ? 'Perplexity Theme' : t === 'slack' ? 'Slack Theme' : t === 'summer' ? 'Summer Theme' : t === 'sunset' ? 'Sunset Theme' : t === 'valorant' ? 'Valorant Theme' : t === 'supabase' ? 'Supabase Theme' : t === 'amber' ? 'Amber Minimal Theme' : t === 'catppuccin' ? 'Catppuccin Theme' : t === 'clay' ? 'Claymorphism Theme' : t === 'cyberpunk' ? 'Cyberpunk Theme' : t === 'darkmatter' ? 'Dark Matter Theme' : t === 'ocean' ? 'Ocean Breeze Theme' : t === 'quantum' ? 'Quantum Rose Theme' : t === 't3' ? 'T3 Chat Theme' : t === 'tangerine' ? 'Tangerine Theme' : t === 'vintage' ? 'Vintage Paper Theme' : `${t} Theme`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Logo Font Selector */}
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider opacity-60 text-primary">Logo Typography</Label>
                  <Select 
                    value={ui.logoFont ?? 'orbitron'} 
                    onValueChange={(v) => updateTemplate('logoFont', v)}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-primary/5 border-2 border-primary/20 hover:border-primary transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl min-w-[280px] max-h-[450px] shadow-2xl border-2 border-primary/10">
                      {FONT_OPTIONS.map(f => (
                        <SelectItem key={f.id} value={f.id} className="rounded-xl py-3 focus:bg-primary/5 transition-colors">
                          <span className="font-medium text-sm">{f.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Body Font Selector */}
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider opacity-60 text-primary">Body Typography</Label>
                  <Select 
                    value={ui.bodyFont ?? 'inter'} 
                    onValueChange={(v) => updateTemplate('bodyFont', v)}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-primary/5 border-2 border-primary/20 hover:border-primary transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl min-w-[280px] max-h-[450px] shadow-2xl border-2 border-primary/10">
                      {FONT_OPTIONS.map(f => (
                        <SelectItem key={f.id} value={f.id} className="rounded-xl py-3 focus:bg-primary/5 transition-colors">
                          <span className="font-medium text-sm">{f.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
           </CardContent>
        </Card>

      </div>

      <div className="p-6 bg-primary/5 rounded-3xl border border-primary/20 flex items-center justify-between gap-4 mt-12">
        <div className="flex items-center gap-4">
           <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white"><Eye className="h-6 w-6" /></div>
           <div>
              <h3 className="font-bold">Live Preview Ready</h3>
              <p className="text-xs text-muted-foreground">Tenant-specific configurations are applied instantly upon saving.</p>
           </div>
        </div>
        <Button variant="outline" className="rounded-full font-bold" onClick={() => window.open('/', '_blank')}>View Store <ChevronRight className="h-4 w-4 ml-1" /></Button>
      </div>
    </div>
  );
}
