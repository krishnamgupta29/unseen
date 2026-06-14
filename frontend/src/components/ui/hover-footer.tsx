"use client";

import React, { useRef, useEffect, useState, MouseEvent } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Mail } from "lucide-react";
import Link from "next/link";

interface TextHoverEffectProps {
  text: string;
  duration?: number;
  className?: string;
}

export const TextHoverEffect = ({
  text,
  duration,
  className,
}: TextHoverEffectProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  useEffect(() => {
    if (svgRef.current) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
      setMaskPosition({
        cx: `${cxPercentage}%`,
        cy: `${cyPercentage}%`,
      });
    }
  }, [cursor]);

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    setCursor({ x: e.clientX, y: e.clientY });
  };

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 300 100"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMouseMove}
      className={cn("select-none uppercase cursor-pointer", className)}
    >
      <defs>
        <linearGradient
          id="textGradient"
          gradientUnits="userSpaceOnUse"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          {hovered && (
            <>
              <stop offset="0%" stopColor="#c77dff" />
              <stop offset="25%" stopColor="#9d4edd" />
              <stop offset="50%" stopColor="#7b2cbf" />
              <stop offset="75%" stopColor="#5a189a" />
              <stop offset="100%" stopColor="#3c096c" />
            </>
          )}
        </linearGradient>

        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="20%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{ duration: duration ?? 0, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="textMask">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#revealMask)"
          />
        </mask>
      </defs>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.3"
        className="fill-transparent stroke-neutral-200 font-[helvetica] text-7xl font-bold dark:stroke-neutral-800"
        style={{ opacity: hovered ? 0.7 : 0 }}
      >
        {text}
      </text>
      <motion.text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.3"
        className="fill-transparent stroke-[#7b2cbf] font-[helvetica] text-7xl font-bold 
        dark:stroke-[#7b2cbf99]"
        initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
        animate={{
          strokeDashoffset: 0,
          strokeDasharray: 1000,
        }}
        transition={{
          duration: 4,
          ease: "easeInOut",
        }}
      >
        {text}
      </motion.text>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        stroke="url(#textGradient)"
        strokeWidth="0.3"
        mask="url(#textMask)"
        className="fill-transparent font-[helvetica] text-7xl font-bold"
      >
        {text}
      </text>
    </svg>
  );
};

export const FooterBackgroundGradient = () => {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(125% 125% at 50% 10%, #08001666 50%, #7b2cbf33 100%)",
      }}
    />
  );
};

export default function HoverFooter() {
  const footerLinks = [
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Contact Us", href: "/contact" },
      ],
    },
    {
      title: "Helpful Links",
      links: [
        { label: "FAQs", href: "/faq" },
        { label: "Download APK", href: "/download" },
        {
          label: "Live Chat Support",
          href: "#",
          pulse: true,
        },
      ],
    },
  ];

  const contactInfo = [
    {
      icon: <Mail size={18} className="text-[#7b2cbf]" />,
      text: "useen3113@gmail.com",
      href: "mailto:useen3113@gmail.com",
    },
  ];

  return (
    <footer className="bg-[#080016]/40 border border-unseen-800/40 relative h-fit rounded-3xl overflow-hidden m-8 z-10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto p-14 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 lg:gap-16 pb-12">
          {/* Brand section */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-[#7b2cbf] text-3xl font-extrabold">
                &hearts;
              </span>
              <span className="text-white text-3xl font-bold tracking-wider">UNSEEN</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Unseen is a mysterious, anonymous-first social platform. Share confessions, thoughts, and chat without revealing your identity.
            </p>
          </div>

          {/* Footer link sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-white text-lg font-semibold mb-6">
                {section.title}
              </h4>
              <ul className="space-y-3 text-gray-400">
                {section.links.map((link) => (
                  <li key={link.label} className="relative w-fit">
                    {link.href.startsWith("/") ? (
                      <Link
                        href={link.href}
                        className="hover:text-[#7b2cbf] transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="hover:text-[#7b2cbf] transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                    {link.pulse && (
                      <span className="absolute top-1.5 right-[-14px] w-2 h-2 rounded-full bg-[#7b2cbf] animate-pulse"></span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact section */}
          <div>
            <h4 className="text-white text-lg font-semibold mb-6">
              Contact Us
            </h4>
            <ul className="space-y-4 text-gray-400">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-center space-x-3">
                  {item.icon}
                  {item.href ? (
                    <a
                      href={item.href}
                      className="hover:text-[#7b2cbf] transition-colors"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="hover:text-[#7b2cbf] transition-colors">
                      {item.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="border-t border-unseen-800/50 my-8" />

        {/* Footer bottom */}
        <div className="flex justify-center items-center text-sm">
          {/* Copyright */}
          <p className="text-center text-gray-500">
            &copy; {new Date().getFullYear()} Unseen. All rights reserved.
          </p>
        </div>
      </div>

      {/* Text hover effect */}
      <div className="lg:flex hidden h-[30rem] -mt-52 -mb-36">
        <TextHoverEffect text="UNSEEN" className="z-10" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}
