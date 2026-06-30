import { Facebook, Github, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  const linkGroups = [
    ['Weekly Themes', 'Pre-Sale FAQs', 'Submit A Ticket'],
    ['Services', 'Theme Tweak'],
    ['Showcase', 'Widgetkit', 'Support'],
    ['About Us', 'Contact Us', 'Affiliates', 'Resources'],
  ];

  const socials = [
    { icon: Facebook, label: 'Facebook', href: '#' },
    { icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/in/san-rai/' },
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Github, label: 'GitHub', href: 'https://github.com/sanjeevRae' },
  ];

  return (
    <footer className="bg-[#111111] px-6 py-12 text-white sm:px-10 md:px-16 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-[0.92fr_2fr] md:gap-16">
          <div>
            <img src="/logo.png" alt="Saud Leather" className="h-8 w-auto object-contain" />
            <p className="mt-2 font-body text-sm font-normal text-white/70">
             
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
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
            {socials.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)] ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-[#111111]"
              >
                <Icon size={18} strokeWidth={1.9} />
              </a>
            ))}
          </div>
          <p className="mt-5 font-body text-xs text-white/80">
            ©Copyright. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
