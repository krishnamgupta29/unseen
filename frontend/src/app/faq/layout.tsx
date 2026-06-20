import type { Metadata } from 'next';

const BASE_URL = 'https://unseen-world.vercel.app';

export const metadata: Metadata = {
  title: 'UNSEEN World FAQ',
  description:
    'Frequently Asked Questions about UNSEEN World. Find answers on how our anonymous social network, encryption, privacy protection, and community moderation work.',
  alternates: { canonical: `${BASE_URL}/faq/` },
  openGraph: {
    title: 'UNSEEN World FAQ',
    description:
      'Frequently Asked Questions about UNSEEN World. Find answers on how our anonymous social network, encryption, privacy protection, and community moderation work.',
    url: `${BASE_URL}/faq/`,
    images: [{ url: `${BASE_URL}/social-preview.png`, width: 1200, height: 630, alt: 'UNSEEN World' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNSEEN World FAQ',
    description:
      'Frequently Asked Questions about UNSEEN World. Find answers on how our anonymous social network, encryption, privacy protection, and community moderation work.',
    images: [`${BASE_URL}/social-preview.png`],
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
