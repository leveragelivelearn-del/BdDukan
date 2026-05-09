import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getTenantDomain } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost';
  
  // Standardized domain resolution
  const tenantDomain = await getTenantDomain(); 
  
  // Detect protocol safely
  const forwardedProto = headersList.get('x-forwarded-proto');
  const protocol = (forwardedProto === 'http' || forwardedProto === 'https') 
    ? forwardedProto 
    : (host.includes('localhost') ? 'http' : 'https');
    
  const BASE_URL = `${protocol}://${host}`;
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/', 
        '/dashboard/', 
        '/api/', 
        '/checkout/', 
        '/login/', 
        '/register/', 
        '/forgot-password/', 
        '/reset-password/',
        '/wishlist/'
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
