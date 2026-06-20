import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | UNSEEN World',
  description: 'Create an anonymous account on UNSEEN World.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
