import type { Metadata } from 'next';

const BASE_URL = 'https://unseen-world.vercel.app';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with the UNSEEN team. We are here to help with questions, feedback, or support requests.',
  alternates: { canonical: `${BASE_URL}/contact` },
  openGraph: {
    title: 'Contact | UNSEEN',
    description:
      'Get in touch with the UNSEEN team. We are here to help with questions, feedback, or support requests.',
    url: `${BASE_URL}/contact`,
    images: [{ url: `${BASE_URL}/icon-512.png`, width: 512, height: 512, alt: 'UNSEEN' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact | UNSEEN',
    description:
      'Get in touch with the UNSEEN team. We are here to help with questions, feedback, or support requests.',
    images: [`${BASE_URL}/icon-512.png`],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
