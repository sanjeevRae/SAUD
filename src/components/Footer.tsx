'use client';

import { useEffect, useState } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import type { SocialLink } from '@/lib/storefront';

type BrandIconProps = { size?: number; className?: string };

function FacebookIcon({ size = 18, className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true" fill="currentColor">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.77l-.44 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06z" />
    </svg>
  );
}

function InstagramIcon({ size = 18, className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ size = 18, className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true" fill="currentColor">
      <path d="M16.55 2c.32 2.67 1.82 4.27 4.45 4.44v3.01a7.67 7.67 0 0 1-4.38-1.39v6.32c0 4.48-4.86 7.27-8.73 5.03-3.85-2.23-3.63-7.88.38-9.78a7.32 7.32 0 0 1 3.35-.63v3.2c-.46-.06-.93-.01-1.37.15-1.57.57-2.18 2.47-1.12 3.73 1.04 1.24 3.1.96 3.73-.56.14-.35.21-.74.21-1.12V2h3.48z" />
    </svg>
  );
}

const socialIcon = (platform: string) => {
  const key = platform.toLowerCase();
  if (key.includes('facebook') || key === 'fb') return FacebookIcon;
  if (key.includes('instagram') || key === 'insta') return InstagramIcon;
  if (key.includes('tiktok')) return TikTokIcon;
  return LinkIcon;
};

export default function Footer({ socialLinks }: { socialLinks?: SocialLink[] }) {
  const [socials, setSocials] = useState<SocialLink[]>(socialLinks ?? []);
  const linkGroups = [
    ['Weekly Themes', 'Pre-Sale FAQs', 'Submit A Ticket'],
    ['Services', 'Theme Tweak'],
    ['Showcase', 'Widgetkit', 'Support'],
    ['About Us', 'Contact Us', 'Affiliates', 'Resources'],
  ];

  useEffect(() => {
    if (socialLinks?.length) {
      setSocials(socialLinks);
      return;
    }

    let mounted = true;
    const loadSocials = async () => {
      const response = await fetch('/api/storefront?action=socials');
      const data = await response.json().catch(() => ({}));
      if (mounted && response.ok) setSocials(data.socialLinks ?? []);
    };

    void loadSocials();
    return () => {
      mounted = false;
    };
  }, [socialLinks]);

  return (
    <footer className="bg-[#111111] px-6 py-12 text-white sm:px-10 md:px-16 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-[1.2fr_3fr] md:gap-16">
          <div className="flex h-42 w-40 items-center overflow-hidden">
            <img src="/logo.png" alt="Saud Leather" className="h-full w-full object-contain object-left" />
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4 padding-top-4">
            {linkGroups.map((links, groupIndex) => (
              <ul key={groupIndex} className="space-y-2">
                {links.map(link => (
                  <li key={link}>
                    <a
                      href="#"
                      className="font-body text-sm font-normal text-white/82 transition-colors hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <div className="my-10 h-px bg-white/28 md:my-14" />

        <div className="flex flex-col items-center">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {socials.filter(item => item.enabled !== false && item.href && item.href !== '#').map(({ id, platform, href }) => {
              const Icon = socialIcon(platform);
              return (
              <a
                key={id || platform}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={platform}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)] ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-[#111111]"
              >
                <Icon size={18} />
              </a>
              );
            })}
          </div>
          <p className="mt-5 font-body text-xs text-white/80">
            ©Copyright. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
