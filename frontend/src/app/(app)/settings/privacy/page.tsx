'use client';

import Header from '@/components/layout/Header';

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full min-h-screen pb-20">
      <Header title="Privacy Policy" showBack />
      
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
        <div className="glass p-8 rounded-3xl border border-unseen-800/50">
          <h1 className="text-3xl font-poppins font-bold text-white mb-6">Privacy Policy</h1>
          <p className="text-gray-400 text-sm mb-8">Last updated: May 2026</p>

          <div className="space-y-6 text-gray-300 font-inter leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-unseen-300 mb-3">1. Your Anonymity is Paramount</h2>
              <p>At Unseen, we believe in radical privacy. Your true identity, including your IP address and device information, is cryptographically hashed and never directly associated with your posts in plain text. You are meant to be a shadow.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-unseen-300 mb-3">2. Data We Collect</h2>
              <p>We collect only what is necessary to run the platform:</p>
              <ul className="list-disc pl-5 mt-2 space-y-2 text-gray-400">
                <li>Your recovery email (strongly encrypted, used only for password resets).</li>
                <li>Your anonymous username and generated display name.</li>
                <li>The content of your posts, likes, and comments.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-unseen-300 mb-3">3. How We Use Your Data</h2>
              <p>Your data is used strictly to provide the Unseen experience. We do not sell your data to third-party advertisers. We do not track you across the internet. Our machine learning models analyze text strictly to enforce community guidelines (hate speech, spam) and do not retain personal identifiers.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-unseen-300 mb-3">4. Security Measures</h2>
              <p>All private messages are encrypted. Our databases are secured using industry-standard AES-256 encryption. While no system is 100% impenetrable, we employ ethical hackers to continuously audit our defenses.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-unseen-300 mb-3">5. Data Deletion</h2>
              <p>You own your data. If you choose to delete your account, all associated posts, comments, and messages are permanently wiped from our active servers within 24 hours.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
