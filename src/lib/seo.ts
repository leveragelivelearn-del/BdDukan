/**
 * SEO Utilities for BD Dukan
 * Generates Structured Data (JSON-LD) for Search Engines
 */

export function generateOrganizationSchema(settings: any, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.brandName || 'BD Dukan',
    url: baseUrl,
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

export function generateProductSchema(product: any, baseUrl: string) {
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
      url: `${baseUrl}/product/${product.slug}`,
      priceCurrency: 'BDT',
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

export function generateBlogSchema(blog: any, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    image: blog.thumbnail ? [blog.thumbnail] : [],
    datePublished: blog.createdAt,
    dateModified: blog.updatedAt || blog.createdAt,
    author: {
      '@type': 'Organization',
      name: 'BD Dukan',
    },
    description: blog.metaDescription || blog.title,
    url: `${baseUrl}/blog/${blog.slug}`,
  };
}
