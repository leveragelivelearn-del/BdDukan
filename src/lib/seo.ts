import { headers } from 'next/headers';

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

const extractTextFromNode = (node: any): string => {
  if (!node) return '';
  if (node.type === 'text') {
    return node.text || '';
  }
  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromNode).join(' ');
  }
  return '';
};

export function stripHtml(html: string) {
  if (!html) return '';
  
  // Detect JSON format from Novel/Tiptap editor
  if (typeof html === 'string' && (html.startsWith('{') || html.startsWith('['))) {
    try {
      const parsed = JSON.parse(html);
      const content = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
      const plainText = extractTextFromNode(content);
      if (plainText) {
        return plainText.replace(/\s+/g, ' ').trim();
      }
    } catch {
      // Fallback to regex stripping in case of malformed JSON
    }
  }
  
  return html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

export async function generateOrganizationSchema(settings: any) {
  const baseUrl = await getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.brandName || 'BD Dukan',
    url: baseUrl,
    logo: settings.logoUrl || settings.logo,
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

export async function generateProductSchema(product: any) {
  const price = product.salePrice ?? product.price;
  const baseUrl = await getBaseUrl();
  const description = stripHtml(product.description || '').slice(0, 300);
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: description,
    sku: product.sku || product._id.toString(),
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
      priceValidUntil: new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split('T')[0], // End of current year
    },
    aggregateRating: product.ratings > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.ratings,
      reviewCount: product.numReviews || 1,
    } : undefined,
  };
}

export async function generateBreadcrumbSchema(items: { name: string; item: string }[]) {
  const baseUrl = await getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item.startsWith('http') ? item.item : `${baseUrl}${item.item.startsWith('/') ? '' : '/'}${item.item}`,
    })),
  };
}

export async function generateBlogSchema(blog: any) {
  const baseUrl = await getBaseUrl();
  const description = stripHtml(blog.metaDescription || blog.title).slice(0, 160);
  
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
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'BD Dukan',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`, // Fallback or use settings logo if passed
      }
    },
    description: description,
    url: `${baseUrl}/blog/${blog.slug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${blog.slug}`,
    },
  };
}
