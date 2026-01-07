'use client';

import { Facebook, Twitter, Instagram, Youtube, Linkedin } from 'lucide-react';

const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:text-blue-600' },
    { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:text-sky-500' },
    { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:text-pink-600' },
    { icon: Youtube, href: '#', label: 'Youtube', color: 'hover:text-red-600' },
    { icon: Linkedin, href: '#', label: 'LinkedIn', color: 'hover:text-blue-700' },
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
