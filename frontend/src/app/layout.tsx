import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import SecurityOverlay from '@/components/SecurityOverlay';
import IntroGate from '@/components/IntroGate';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Unseen | Say what you can\'t say anywhere else',
  description: 'A mysterious anonymous-first social media platform where users can freely share thoughts, confessions, and experiences.',
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="antialiased min-h-screen flex flex-col bg-[#080016] text-white select-none">
        <SecurityOverlay />
        <AppProvider>
          <IntroGate>
            {children}
          </IntroGate>
        </AppProvider>
      </body>
    </html>
  );
}
