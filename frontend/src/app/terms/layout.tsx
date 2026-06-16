import type { Metadata } from 'next';

const BASE_URL = 'https://unseen-world.vercel.app';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Review the UNSEEN Terms of Service — the rules and guidelines that govern your use of our anonymous social platform.',
  alternates: { canonical: `${BASE_URL}/terms` },
  openGraph: {
    title: 'Terms of Service | UNSEEN',
    description:
      'Review the UNSEEN Terms of Service — the rules and guidelines that govern your use of our anonymous social platform.',
    url: `${BASE_URL}/terms`,
    images: [{ url: `${BASE_URL}/icon-512.png`, width: 512, height: 512, alt: 'UNSEEN' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | UNSEEN',
    description:
      'Review the UNSEEN Terms of Service — the rules and guidelines that govern your use of our anonymous social platform.',
    images: [`${BASE_URL}/icon-512.png`],
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
