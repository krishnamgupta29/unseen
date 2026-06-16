import type { Metadata } from 'next';

const BASE_URL = 'https://unseen-world.vercel.app';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Read the UNSEEN Privacy Policy to understand how we handle your data and protect your anonymity on our platform.',
  alternates: { canonical: `${BASE_URL}/privacy` },
  openGraph: {
    title: 'Privacy Policy | UNSEEN',
    description:
      'Read the UNSEEN Privacy Policy to understand how we handle your data and protect your anonymity on our platform.',
    url: `${BASE_URL}/privacy`,
    images: [{ url: `${BASE_URL}/icon-512.png`, width: 512, height: 512, alt: 'UNSEEN' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | UNSEEN',
    description:
      'Read the UNSEEN Privacy Policy to understand how we handle your data and protect your anonymity on our platform.',
    images: [`${BASE_URL}/icon-512.png`],
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
