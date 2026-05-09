import { headers } from 'next/headers';

/**
 * Gets the current tenant domain from the request headers.
 * Fallback to 'localhost' for local development.
 */
export async function getTenantDomain(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost';
  // Strip port if present (e.g., localhost:3000 -> localhost)
  let domain = host.split(':')[0];
  
  // Strip 'www.' if present for consistency (e.g., www.mibd.shop -> mibd.shop)
  if (domain.startsWith('www.')) {
    domain = domain.replace('www.', '');
  }
  
  return domain;
}

/**
 * Injects the domain into a query or data object for tenant isolation/association.
 */
export function withTenant<T extends object>(data: T, domain: string): T & { domain: string } {
  if (!domain) {
    throw new Error('Tenant domain is required');
  }
  return { ...data, domain };
}

/**
 * Alias for withTenant, used for semantic clarity when associating data.
 */
export function forTenant<T extends object>(data: T, domain: string): T & { domain: string } {
  return withTenant(data, domain);
}
