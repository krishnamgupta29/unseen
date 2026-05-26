'use client';

import LandingPage from '@/components/LandingPage';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#080016]">
      <motion.div
        key="landing"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full"
      >
        <LandingPage />
      </motion.div>
    </main>
  );
}
