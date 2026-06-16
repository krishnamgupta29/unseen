import type { Metadata } from 'next';

const BASE_URL = 'https://unseen-world.vercel.app';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about UNSEEN — the privacy-first anonymous social platform built for honest, identity-free expression.',
  alternates: { canonical: `${BASE_URL}/about` },
  openGraph: {
    title: 'About | UNSEEN',
    description:
      'Learn about UNSEEN — the privacy-first anonymous social platform built for honest, identity-free expression.',
    url: `${BASE_URL}/about`,
    images: [{ url: `${BASE_URL}/icon-512.png`, width: 512, height: 512, alt: 'UNSEEN' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About | UNSEEN',
    description:
      'Learn about UNSEEN — the privacy-first anonymous social platform built for honest, identity-free expression.',
    images: [`${BASE_URL}/icon-512.png`],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
