'use client';

import { Facebook, Twitter, Instagram, Youtube, Linkedin } from 'lucide-react';

const socialLinks: any[] = [
    // Empty array to hide social icons for now. Re-add when there are valid URLs.
];

export default function SocialLinks() {
    return (
        <div className="flex gap-3">
            {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                    <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`
              flex items-center justify-center
              w-10 h-10
              bg-slate-100 dark:bg-slate-800
              rounded-full
              text-slate-600 dark:text-slate-400
              ${social.color}
              transition-all
              btn-hover-lift
              icon-hover-bounce
            `}
                        aria-label={social.label}
                    >
                        <Icon size={20} />
                    </a>
                );
            })}
        </div>
    );
}
