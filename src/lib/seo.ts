/**
 * SEO Utilities for BD Dukan
 * Generates Structured Data (JSON-LD) for Search Engines
 */

export function generateOrganizationSchema(settings: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.brandName || 'BD Dukan',
    url: process.env.NEXTAUTH_URL || 'https://www.bd-dukan.com',
    logo: settings.logo,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: settings.contact?.phone,
      contactType: 'customer service',
      email: settings.contact?.email,
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.contact?.address,
    },
  };
}

export function generateProductSchema(product: any) {
  const price = product.salePrice ?? product.price;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.description,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'BD Dukan',
    },
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXTAUTH_URL || 'https://www.bd-dukan.com'}/product/${product.slug}`,
      priceCurrency: 'USD',
      price: price,
      availability: Number.isFinite(product.stock) && product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

export function generateBreadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}
