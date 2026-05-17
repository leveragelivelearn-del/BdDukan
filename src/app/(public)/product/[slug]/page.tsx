/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Metadata } from 'next';
import { generateProductSchema, generateBreadcrumbSchema, stripHtml } from '@/lib/seo';
import { ProductDetailsSelector } from '@/components/templates/ServerRegistry';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ViewTracker } from '@/components/common/ViewTracker';
import { getCachedProductBySlug, getCachedSettings } from '@/lib/data-fetching';
import { notFound } from 'next/navigation';
import { getTenantDomain } from '@/lib/tenant';

const sanitizeForScript = (json: any) => {
  return JSON.stringify(json).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
};

const getProduct = async (domain: string, slug: string) => {
  return getCachedProductBySlug(domain, slug);
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const domain = await getTenantDomain();
  const headersList = await headers();
  const hostname = headersList.get('host') || 'localhost';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${protocol}://${hostname}`;

  const [product, settings] = await Promise.all([
    getProduct(domain, slug),
    getCachedSettings(hostname)
  ]);
  if (!product) return { title: 'Product Not Found' };

  const safeDescription = stripHtml(product.description || '').slice(0, 160);
  const mainImage = product.images?.[0] ? [{ url: product.images[0], alt: product.name }] : [];
  const twitterImage = product.images?.[0] ? [product.images[0]] : [];
  const siteName = settings?.brandName || 'Online Shop';
  const canonicalUrl = `${baseUrl}/product/${slug}`;

  return {
    title: product.name,
    description: safeDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: product.name,
      description: safeDescription,
      images: mainImage,
      type: 'website', // Standard Next.js type
      url: canonicalUrl,
      siteName: siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: safeDescription,
      images: twitterImage,
    },
    other: {
      'product:price:amount': (product.salePrice ?? product.price).toString(),
      'product:price:currency': 'BDT',
      'product:availability': product.stock > 0 ? 'instock' : 'oos',
    }
  };
}

import { headers } from 'next/headers';
import Script from 'next/script';

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const domain = await getTenantDomain();
  const headersList = await headers();
  const hostname = headersList.get('host') || 'localhost';

  const [product, settings] = await Promise.all([
    getProduct(domain, slug),
    getCachedSettings(hostname)
  ]);

  if (!product) {
    notFound();
  }



  let related = [];
  try {
    const conn = await (await import('@/lib/db')).default();
    const ProductModel = (await import('@/models/Product')).default;
    const relatedProducts = await ProductModel.find({
      domain,
      _id: { $ne: product._id },
      isPublished: true,
      $or: [
        { categories: { $in: (product.categories ?? []).map((category: { _id: string }) => category._id) } },
        { tags: { $in: product.tags || [] } },
      ],
    })
      .populate('categories')
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();
    related = JSON.parse(JSON.stringify(relatedProducts));
  } catch (error) {
    console.error("Error fetching related products:", error);
    related = [];
  }

  const productSchema = await generateProductSchema(product);
  const breadcrumbSchema = await generateBreadcrumbSchema([
    { name: 'Home', item: '/' },
    { name: 'Shop', item: '/shop' },
    { name: product.name, item: `/product/${product.slug}` }
  ]);

  return (
    <>
      {productSchema && (
        <Script
          id="product-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeForScript(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <Script
          id="breadcrumb-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeForScript(breadcrumbSchema) }}
        />
      )}

      {/* Track View */}
      <ViewTracker 
        id={product._id.toString()} 
        type="product" 
        productName={product.name}
        price={product.salePrice ?? product.price}
      />
      
      {/* Dynamic Product Detail Template Selector */}
      <ProductDetailsSelector style={settings?.uiTemplates?.productDetail || 'v1'} product={product} />

      {Array.isArray(related) && related.length > 0 && (
        <div className="container px-4 md:px-0 mx-auto py-10">
          <section className="mt-20">
            <div className="flex items-end justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight">You May Also Like</h2>
                <p className="text-muted-foreground mt-1">Similar picks based on this product&apos;s category and tags.</p>
              </div>
              <Button variant="outline" render={<Link href="/shop" />} nativeButton={false}>
                Explore More
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item: any) => (
                <ProductCard key={item._id} product={item} style={settings?.uiTemplates?.productCard || 'v1'} />
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
