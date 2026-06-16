import type { Metadata } from 'next';

const BASE_URL = 'https://unseen-world.vercel.app';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Frequently asked questions about UNSEEN — how anonymity works, account management, privacy, and more.',
  alternates: { canonical: `${BASE_URL}/faq` },
  openGraph: {
    title: 'FAQ | UNSEEN',
    description:
      'Frequently asked questions about UNSEEN — how anonymity works, account management, privacy, and more.',
    url: `${BASE_URL}/faq`,
    images: [{ url: `${BASE_URL}/icon-512.png`, width: 512, height: 512, alt: 'UNSEEN' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | UNSEEN',
    description:
      'Frequently asked questions about UNSEEN — how anonymity works, account management, privacy, and more.',
    images: [`${BASE_URL}/icon-512.png`],
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
