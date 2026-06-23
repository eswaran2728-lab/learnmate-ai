import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LearnMate AI — Your Personal AI Teacher',
  description: 'AI-powered personalised learning platform that teaches according to your actual ability level, not just your school year.',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  keywords: ['AI tutor', 'personalised learning', 'homework help', 'Malaysia education'],
  authors: [{ name: 'ESWARAN A/L Padmanathan' }],
  openGraph: {
    title: 'LearnMate AI — Your Personal AI Teacher',
    description: 'Smart AI learning for every Malaysian student',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563EB',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
