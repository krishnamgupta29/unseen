'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, ChevronDown, MessageSquare, Shield, Smartphone, Trash2, Mail } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ReactNode;
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqItems: FAQItem[] = [
    {
      question: "What is Unseen?",
      answer: "Unseen is a mysterious, anonymous-first social platform. It allows you to share confessions, midnight thoughts, and chat with strangers without ever revealing your real name, email, or personal identity.",
      icon: <MessageSquare className="w-5 h-5 text-unseen-400" />
    },
    {
      question: "How does Unseen guarantee my privacy?",
      answer: "We do not request personal credentials such as your phone number or real name. Passwords are securely hashed with bcrypt, and all private chats are encrypted using AES-256 before being stored in our database. We will never sell or share your data.",
      icon: <Shield className="w-5 h-5 text-unseen-400" />
    },
    {
      question: "Is Unseen safe to use?",
      answer: "Absolutely. While we prioritize anonymity, we have zero tolerance for harassment, hate speech, or abuse. We employ automated AI-driven moderation alongside community reporting mechanisms to keep our space safe and supportive.",
      icon: <HelpCircle className="w-5 h-5 text-unseen-400" />
    },
    {
      question: "Is there an Android/mobile app?",
      answer: "Yes! You can download the official Unseen APK directly from the footer of our website. The mobile version is optimized for performance, skips intro loops automatically for returning users, and loads instantly.",
      icon: <Smartphone className="w-5 h-5 text-unseen-400" />
    },
    {
      question: "Can I delete my confessions or posts?",
      answer: "Yes. You have full control. If you delete a confession, post, or message, it is permanently wiped from our databases. There are no backups or archive logs kept of deleted user content.",
      icon: <Trash2 className="w-5 h-5 text-unseen-400" />
    },
    {
      question: "How can I contact support or report issues?",
      answer: "You can reach out directly via email at useen3113@gmail.com for general support, partner requests, or moderation appeals. You can also visit our Contact Page for direct links.",
      icon: <Mail className="w-5 h-5 text-unseen-400" />
    }
  ];

  return (
    <main className="min-h-screen bg-[#080016] text-gray-300 font-inter overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-unseen-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-unseen-800/20 rounded-full blur-[150px]" />
      </div>

      <nav className="w-full p-6 relative z-10 max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center text-unseen-400 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
        <div className="text-xl font-poppins font-bold text-transparent bg-clip-text bg-gradient-to-r from-unseen-200 to-unseen-400 font-bold tracking-wider">
          UNSEEN
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-12 pb-24 relative z-10">
        <h1 className="text-4xl md:text-5xl font-poppins font-bold text-white mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-unseen-400 mb-12">
          Find answers to common questions about anonymity, safety, and using the Unseen platform.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* FAQ Accordion List */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {faqItems.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className="glass rounded-2xl border border-unseen-800/50 bg-[#09031a]/30 overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFAQ(idx)}
                    className="w-full p-6 flex items-center justify-between text-left focus:outline-none hover:bg-unseen-950/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-unseen-900/80 p-2.5 rounded-xl border border-unseen-800 flex items-center justify-center">
                        {item.icon}
                      </div>
                      <span className="font-semibold text-white text-base md:text-lg">
                        {item.question}
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-unseen-400"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 pt-2 text-gray-300 text-sm md:text-base border-t border-unseen-800/20 leading-relaxed font-inter">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Desktop Visual Graphic Widget */}
          <div className="hidden lg:flex lg:col-span-5 w-full justify-center sticky top-6">
            <div className="relative w-full max-w-[400px] h-[450px] flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-unseen-800 bg-[#09031a]/45 shadow-2xl glass p-6">
              {/* Graphic Ring visual background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(123,44,191,0.1)_0%,transparent_70%)]" />
              
              {/* Spinning decorative orbit */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute w-64 h-64 rounded-full border border-dashed border-unseen-500/20"
              />

              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute w-48 h-48 rounded-full border border-dotted border-unseen-400/30"
              />

              {/* Core FAQ Visual Oracle */}
              <motion.div
                animate={{
                  y: [0, -10, 0]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-tr from-unseen-800/80 to-unseen-950/80 border border-unseen-450 flex items-center justify-center shadow-[0_0_30px_rgba(157,78,221,0.3)]"
              >
                <HelpCircle className="w-16 h-16 text-unseen-300 drop-shadow-[0_0_10px_rgba(157,78,221,0.6)] animate-pulse" />
              </motion.div>

              <div className="absolute bottom-12 text-center z-10">
                <h3 className="font-poppins font-bold text-white text-lg mb-2">Need More Help?</h3>
                <p className="text-xs text-gray-400 max-w-[240px] mx-auto mb-4">
                  If you can't find the answers you need, feel free to contact our support team.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center bg-gradient-to-r from-unseen-600 to-unseen-700 hover:from-unseen-500 hover:to-unseen-650 text-white font-semibold text-xs px-6 py-2.5 rounded-full border border-unseen-450 shadow-md transition-all hover:scale-[1.03]"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
