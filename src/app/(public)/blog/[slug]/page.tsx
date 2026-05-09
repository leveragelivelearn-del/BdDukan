import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getCachedBlogBySlug, getCachedSettings } from '@/lib/data-fetching';
import { getTenantDomain } from '@/lib/tenant';
import { BlogDetailsSelector } from '@/components/templates/ServerRegistry';
import { ViewTracker } from '@/components/common/ViewTracker';

interface BlogDetailProps {
  params: Promise<{ slug: string }>;
}

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
  const blog = await getBlog(domain, slug);

  if (!blog) return { title: 'Blog Not Found' };

  return {
    title: blog.metaTitle || blog.title,
    description: blog.metaDescription,
    openGraph: {
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription,
      images: blog.thumbnail ? [blog.thumbnail] : [],
      type: 'article',
    },
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

  return (
    <>
      <ViewTracker id={blogId} type="blog" />
      <BlogDetailsSelector 
        style={style} 
        blog={blog} 
        readingTime={readingTime} 
      />
    </>
  );
}
