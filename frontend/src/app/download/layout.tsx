import type { Metadata } from 'next';

const BASE_URL = 'https://unseen-world.vercel.app';

export const metadata: Metadata = {
  title: 'Download UNSEEN World App',
  description:
    'Download the UNSEEN World mobile app for Android. Stay anonymous, stay free — download the direct APK now and connect securely.',
  alternates: { canonical: `${BASE_URL}/download/` },
  openGraph: {
    title: 'Download UNSEEN World App',
    description:
      'Download the UNSEEN World mobile app for Android. Stay anonymous, stay free — download the direct APK now and connect securely.',
    url: `${BASE_URL}/download/`,
    images: [{ url: `${BASE_URL}/social-preview.png`, width: 1200, height: 630, alt: 'UNSEEN World' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Download UNSEEN World App',
    description:
      'Download the UNSEEN World mobile app for Android. Stay anonymous, stay free — download the direct APK now and connect securely.',
    images: [`${BASE_URL}/social-preview.png`],
  },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
