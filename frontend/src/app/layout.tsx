import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import SecurityOverlay from '@/components/SecurityOverlay';
import IntroGate from '@/components/IntroGate';
import DeepLinkRedirect from '@/components/DeepLinkRedirect';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

const BASE_URL = 'https://unseen-world.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  // ── Core ────────────────────────────────────────────────────────────────────
  title: {
    default: 'UNSEEN World – Anonymous Social Platform',
    template: '%s – UNSEEN World',
  },
  description:
    'UNSEEN World is a modern anonymous social platform where people can share thoughts, connect with communities, explore posts, and communicate with privacy.',
  keywords: [
    'Unseen World',
    'Unseen social platform',
    'anonymous social media',
    'anonymous community',
    'private social app',
    'Unseen app',
    'social network',
  ],
  authors: [{ name: 'UNSEEN World', url: BASE_URL }],
  creator: 'UNSEEN World',
  publisher: 'UNSEEN World',
  category: 'social',
  applicationName: 'UNSEEN World',

  // ── Google Search Console Verification ──────────────────────────────────────
  verification: {
    google: 'GB5lpiShbII2a4c2ZukYM5POhb2qO-O6Adl5j0SZAPk',
  },

  // ── Canonical ───────────────────────────────────────────────────────────────
  alternates: {
    canonical: BASE_URL + '/',
  },

  // ── Open Graph ──────────────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    siteName: 'UNSEEN World',
    title: 'UNSEEN World – Anonymous Social Platform',
    description:
      'Share thoughts, discover communities, and connect privately on UNSEEN World.',
    url: BASE_URL + '/',
    images: [
      {
        url: `${BASE_URL}/social-preview.png`,
        width: 1200,
        height: 630,
        alt: 'UNSEEN World – Anonymous Social Platform',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
  },

  // ── Twitter Cards ───────────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'UNSEEN World – Anonymous Social Platform',
    description:
      'A modern anonymous social platform for private expression and community.',
    images: [`${BASE_URL}/social-preview.png`],
    creator: '@unseen_app',
    site: '@unseen_app',
  },

  // ── Robots (default: allow indexing for public pages) ───────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── PWA / Manifest ──────────────────────────────────────────────────────────
  manifest: '/manifest.json',

  // ── Favicon & Icons ─────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [{ rel: 'mask-icon', url: '/icon-512-maskable.png' }],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#16002f',
};

// ── Structured Data JSON-LD ──────────────────────────────────────────────────
const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'UNSEEN World',
    url: 'https://unseen-world.vercel.app/',
    logo: 'https://unseen-world.vercel.app/icon.png',
    description: 'A modern anonymous social platform for sharing thoughts, discovering communities, and connecting privately.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'UNSEEN World',
    url: 'https://unseen-world.vercel.app/',
    description: 'Anonymous social platform and private community network.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'UNSEEN World',
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'Android',
    url: 'https://unseen-world.vercel.app/download/',
    description: 'UNSEEN World is an anonymous social networking application.',
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        {/* Structured Data JSON-LD for Google Rich Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* PWA & mobile meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="UNSEEN" />
        <meta name="msapplication-TileColor" content="#080016" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-[#080016] text-white select-none">
        <SecurityOverlay />
        <AppProvider>
          <DeepLinkRedirect />
          <IntroGate>
            {children}
          </IntroGate>
        </AppProvider>
      </body>
    </html>
  );
}
