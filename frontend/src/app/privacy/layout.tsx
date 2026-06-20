import type { Metadata } from 'next';

const BASE_URL = 'https://unseen-world.vercel.app';

export const metadata: Metadata = {
  title: 'Privacy Policy – UNSEEN World',
  description:
    'Read the UNSEEN World Privacy Policy to understand how we protect your identity, messages, and raw thoughts on our anonymous platform.',
  alternates: { canonical: `${BASE_URL}/privacy/` },
  openGraph: {
    title: 'Privacy Policy – UNSEEN World',
    description:
      'Read the UNSEEN World Privacy Policy to understand how we protect your identity, messages, and raw thoughts on our anonymous platform.',
    url: `${BASE_URL}/privacy/`,
    images: [{ url: `${BASE_URL}/social-preview.png`, width: 1200, height: 630, alt: 'UNSEEN World' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy – UNSEEN World',
    description:
      'Read the UNSEEN World Privacy Policy to understand how we protect your identity, messages, and raw thoughts on our anonymous platform.',
    images: [`${BASE_URL}/social-preview.png`],
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
