import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getCachedBlogBySlug, getCachedSettings } from '@/lib/data-fetching';
import { getTenantDomain } from '@/lib/tenant';
import { BlogDetailsSelector } from '@/components/templates/ServerRegistry';
import { ViewTracker } from '@/components/common/ViewTracker';
import { FBBlogTracker } from '@/components/common/FBBlogTracker';

import { generateBlogSchema, generateBreadcrumbSchema, stripHtml } from '@/lib/seo';
import Script from 'next/script';

interface BlogDetailProps {
  params: Promise<{ slug: string }>;
}

const sanitizeForScript = (json: any) => {
  return JSON.stringify(json).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
};

const getReadingTime = (content: string) => {
  const words = content ? content.split(' ').length : 0;
  return Math.max(1, Math.ceil(words / 220));
};

async function getBlog(domain: string, slug: string) {
  return getCachedBlogBySlug(domain, slug);
}

export async function generateMetadata({ params }: BlogDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const domain = await getTenantDomain();
  const headersList = await headers();
  const hostname = headersList.get('host') || 'localhost';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${protocol}://${hostname}`;

  const [blog, settings] = await Promise.all([
    getBlog(domain, slug),
    getCachedSettings(hostname)
  ]);

  if (!blog) return { title: 'Blog Not Found' };

  const title = blog.metaTitle || blog.title;
  const description = stripHtml(blog.metaDescription || blog.title).slice(0, 160);
  const image = blog.thumbnail ? [{ url: blog.thumbnail, alt: title }] : [];
  const twitterImage = blog.thumbnail ? [blog.thumbnail] : [];
  const siteName = settings?.brandName || 'Online Shop';
  const canonicalUrl = `${baseUrl}/blog/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      images: image,
      type: 'article',
      url: canonicalUrl,
      siteName: siteName,
      publishedTime: blog.createdAt,
      modifiedTime: blog.updatedAt || blog.createdAt,
      authors: ['BD Dukan'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: twitterImage,
    }
  };
}

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const { slug } = await params;
  const domain = await getTenantDomain();
  const headersList = await headers();
  const hostname = headersList.get('host') || 'localhost';

  const [blog, settings] = await Promise.all([
    getBlog(domain, slug),
    getCachedSettings(hostname)
  ]);

  if (!blog) notFound();

  const readingTime = getReadingTime(blog.content);
  const style = settings?.uiTemplates?.blogDetail || 'v1';
  const blogId = blog._id.toString();

  const blogSchema = await generateBlogSchema(blog);
  const breadcrumbSchema = await generateBreadcrumbSchema([
    { name: 'Home', item: '/' },
    { name: 'Blog', item: '/blog' },
    { name: blog.title, item: `/blog/${blog.slug}` }
  ]);

  return (
    <>
      {blogSchema && (
        <Script
          id="blog-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeForScript(blogSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <Script
          id="breadcrumb-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeForScript(breadcrumbSchema) }}
        />
      )}
      <FBBlogTracker title={blog.title} id={blogId} />
      <ViewTracker id={blogId} type="blog" />
      <BlogDetailsSelector 
        style={style} 
        blog={blog} 
        readingTime={readingTime} 
      />
    </>
  );
}
