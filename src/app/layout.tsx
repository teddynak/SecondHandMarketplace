import {siteOrigin} from '@/lib/seo';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { SavedProvider } from '@/components/SavedProvider';
import { AuthProvider } from '@/components/AuthProvider';
import SessionStatus from '@/components/SessionStatus';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import './globals.css';
export const metadata: Metadata = {
 metadataBase:siteOrigin()?new URL(siteOrigin()!):undefined,
 alternates:siteOrigin()?{canonical:siteOrigin()!}:undefined,
 icons: { icon: '/icon.svg' },
 title: { default: 'ReUse Market — Good things deserve a second story', template: '%s | ReUse Market' },
 description: 'Buy and sell used clothes, electronics, books and furniture across Uganda. Prices in UGX. Keep useful things in use.',
 keywords: ['used items', 'second hand marketplace', 'reuse', 'community marketplace', 'Uganda'],
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="en"><body><a href="#main-content" className="skip-link">Skip to content</a><AuthProvider><SavedProvider><SiteHeader/><SessionStatus/><main id="main-content" tabIndex={-1} className="main-content">{children}</main><SiteFooter/><Toaster position="top-right" richColors closeButton /></SavedProvider></AuthProvider></body></html>;
}
