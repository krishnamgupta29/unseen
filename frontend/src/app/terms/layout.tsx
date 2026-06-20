import type { Metadata } from 'next';

const BASE_URL = 'https://unseen-world.vercel.app';

export const metadata: Metadata = {
  title: 'Terms & Conditions – UNSEEN World',
  description:
    'Review the Terms & Conditions of UNSEEN World. Read our rules and guidelines that govern anonymous posting and community standards on our platform.',
  alternates: { canonical: `${BASE_URL}/terms/` },
  openGraph: {
    title: 'Terms & Conditions – UNSEEN World',
    description:
      'Review the Terms & Conditions of UNSEEN World. Read our rules and guidelines that govern anonymous posting and community standards on our platform.',
    url: `${BASE_URL}/terms/`,
    images: [{ url: `${BASE_URL}/social-preview.png`, width: 1200, height: 630, alt: 'UNSEEN World' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms & Conditions – UNSEEN World',
    description:
      'Review the Terms & Conditions of UNSEEN World. Read our rules and guidelines that govern anonymous posting and community standards on our platform.',
    images: [`${BASE_URL}/social-preview.png`],
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
