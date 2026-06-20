import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In | UNSEEN World',
  description: 'Log in to UNSEEN World to connect anonymously.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
