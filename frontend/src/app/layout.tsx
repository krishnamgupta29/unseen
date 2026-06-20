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
    default: 'UNSEEN - Anonymous Social Platform',
    template: '%s | UNSEEN',
  },
  description:
    'UNSEEN is a privacy-first anonymous social platform where users can share thoughts, feelings, confessions, and ideas without revealing their identity.',
  keywords: [
    'anonymous social media',
    'anonymous platform',
    'unseen',
    'confessions',
    'anonymous community',
    'private social network',
    'anonymous posting',
    'social platform',
  ],
  authors: [{ name: 'UNSEEN', url: BASE_URL }],
  creator: 'UNSEEN',
  publisher: 'UNSEEN',
  category: 'social',
  applicationName: 'UNSEEN',

  // ── Google Search Console Verification ──────────────────────────────────────
  verification: {
    google: 'GB5lpiShbII2a4c2ZukYM5POhb2qO-O6Adl5j0SZAPk',
  },

  // ── Canonical ───────────────────────────────────────────────────────────────
  alternates: {
    canonical: BASE_URL,
  },

  // ── Open Graph ──────────────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    siteName: 'UNSEEN',
    title: 'UNSEEN - Anonymous Social Platform',
    description:
      'UNSEEN is a privacy-first anonymous social platform where users can share thoughts, feelings, confessions, and ideas without revealing their identity.',
    url: BASE_URL,
    images: [
      {
        url: `${BASE_URL}/icon-512.png`,
        width: 512,
        height: 512,
        alt: 'UNSEEN - Anonymous Social Platform',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
  },

  // ── Twitter Cards ───────────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'UNSEEN - Anonymous Social Platform',
    description:
      'UNSEEN is a privacy-first anonymous social platform where users can share thoughts, feelings, confessions, and ideas without revealing their identity.',
    images: [`${BASE_URL}/icon-512.png`],
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
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    other: [{ rel: 'mask-icon', url: '/icon-512-maskable.png' }],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#080016',
};

// ── Structured Data JSON-LD ──────────────────────────────────────────────────
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'UNSEEN',
      description:
        'A privacy-first anonymous social platform where users share thoughts, feelings, confessions, and ideas without revealing their identity.',
      publisher: { '@id': `${BASE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/explore?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: 'UNSEEN',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/icon-512.png`,
        width: 512,
        height: 512,
      },
      sameAs: [],
    },
    {
      '@type': 'WebApplication',
      '@id': `${BASE_URL}/#webapp`,
      name: 'UNSEEN',
      url: BASE_URL,
      applicationCategory: 'SocialNetworkingApplication',
      operatingSystem: 'Web, Android',
      description:
        'A privacy-first anonymous social platform for sharing thoughts, confessions, and ideas without revealing your identity.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      screenshot: `${BASE_URL}/icon-512.png`,
      creator: { '@id': `${BASE_URL}/#organization` },
    },
  ],
};

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
