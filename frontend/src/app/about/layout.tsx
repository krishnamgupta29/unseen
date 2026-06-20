import type { Metadata } from 'next';

const BASE_URL = 'https://unseen-world.vercel.app';

export const metadata: Metadata = {
  title: 'About UNSEEN World – Anonymous Social Platform',
  description:
    'Learn about UNSEEN World — the privacy-first anonymous social platform built for honest, identity-free expression, safe community connection, and private sharing.',
  alternates: { canonical: `${BASE_URL}/about/` },
  openGraph: {
    title: 'About UNSEEN World – Anonymous Social Platform',
    description:
      'Learn about UNSEEN World — the privacy-first anonymous social platform built for honest, identity-free expression, safe community connection, and private sharing.',
    url: `${BASE_URL}/about/`,
    images: [{ url: `${BASE_URL}/social-preview.png`, width: 1200, height: 630, alt: 'UNSEEN World' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About UNSEEN World – Anonymous Social Platform',
    description:
      'Learn about UNSEEN World — the privacy-first anonymous social platform built for honest, identity-free expression, safe community connection, and private sharing.',
    images: [`${BASE_URL}/social-preview.png`],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
