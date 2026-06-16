import type { Metadata } from 'next';

const BASE_URL = 'https://unseen-world.vercel.app';

export const metadata: Metadata = {
  title: 'Download App',
  description:
    'Download the UNSEEN app for Android. Stay anonymous, stay free — available now as an APK.',
  alternates: { canonical: `${BASE_URL}/download` },
  openGraph: {
    title: 'Download UNSEEN App',
    description:
      'Download the UNSEEN app for Android. Stay anonymous, stay free — available now as an APK.',
    url: `${BASE_URL}/download`,
    images: [{ url: `${BASE_URL}/icon-512.png`, width: 512, height: 512, alt: 'UNSEEN' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Download UNSEEN App',
    description:
      'Download the UNSEEN app for Android. Stay anonymous, stay free — available now as an APK.',
    images: [`${BASE_URL}/icon-512.png`],
  },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
