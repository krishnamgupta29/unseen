import type { Metadata } from 'next';

const BASE_URL = 'https://unseen-world.vercel.app';

export const metadata: Metadata = {
  title: 'Contact UNSEEN World',
  description:
    'Get in touch with the UNSEEN World team. Contact us for any support, feedback, questions, or inquiries regarding our anonymous social platform.',
  alternates: { canonical: `${BASE_URL}/contact/` },
  openGraph: {
    title: 'Contact UNSEEN World',
    description:
      'Get in touch with the UNSEEN World team. Contact us for any support, feedback, questions, or inquiries regarding our anonymous social platform.',
    url: `${BASE_URL}/contact/`,
    images: [{ url: `${BASE_URL}/social-preview.png`, width: 1200, height: 630, alt: 'UNSEEN World' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact UNSEEN World',
    description:
      'Get in touch with the UNSEEN World team. Contact us for any support, feedback, questions, or inquiries regarding our anonymous social platform.',
    images: [`${BASE_URL}/social-preview.png`],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
