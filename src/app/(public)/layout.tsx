import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Marquee } from '@/components/layout/Marquee';
import { getCachedSettings } from '@/lib/data-fetching';
import { headers } from 'next/headers';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const hostname = headersList.get('host') || 'localhost';
  
  let settings = null;
  try {
    settings = await getCachedSettings(hostname);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
  }

  const marqueeText = settings?.marqueeText || 'Welcome to BD Dukan! Free shipping on orders over $500.';
  const ui = {
    navbar: settings?.uiTemplates?.navbar || 'v1',
    footer: settings?.uiTemplates?.footer || 'v1',
  };

  return (
    <>
      <Marquee marqueeText={marqueeText} />
      <Navbar style={ui.navbar} />
      <main className="flex-1">{children}</main>
      <Footer style={ui.footer} />
    </>
  );
}
