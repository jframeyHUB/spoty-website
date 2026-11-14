import type { Metadata, Viewport } from 'next';
import './app.css';

export const metadata: Metadata = {
  title: { default: 'SPOTY', template: '%s · SPOTY' },
  description: 'SPOTY is the global awards for salespeople, decided by votes from the people who have seen you sell.',
  metadataBase: new URL('https://www.spoty.club'),
  icons: { icon: '/assets/spoty-favicon.svg', apple: '/assets/apple-touch-icon.png' },
  openGraph: { siteName: 'SPOTY', images: ['/assets/og.png'] }
};

export const viewport: Viewport = { themeColor: '#0F2742', colorScheme: 'only light' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
