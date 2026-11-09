import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/AuthProvider';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import './globals.css';
export const metadata: Metadata = {
 icons: { icon: '/icon.svg' },
 title: { default: 'ReUse Market — Good things deserve a second story', template: '%s | ReUse Market' },
 description: 'A community marketplace for pre-loved clothes, electronics, books, furniture and more. Buy better. Sell easily. Waste less.',
 keywords: ['used items', 'second hand marketplace', 'reuse', 'community marketplace', 'Uganda'],
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="en"><body><AuthProvider><SiteHeader/><main className="main-content">{children}</main><SiteFooter/><Toaster position="top-right" richColors closeButton /></AuthProvider></body></html>;
}
