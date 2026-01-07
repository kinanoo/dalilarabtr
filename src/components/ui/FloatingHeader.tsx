'use client';

import { motion } from 'framer-motion';
import { Home, Briefcase, FileText, User, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function FloatingHeader() {
    const MENU_ITEMS = [
        { name: 'الرئيسية', icon: Home, href: '#' },
        { name: 'خدمات', icon: Briefcase, href: '#' },
        { name: 'مقالات', icon: FileText, href: '#' },
        { name: 'حسابي', icon: User, href: '#' },
    ];

    return (
        <div className="fixed top-6 left-0 right-0 z-[5000] flex justify-center px-4">
            <motion.nav
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                className="
          flex items-center gap-2 p-2 pl-3 
          bg-white/70 dark:bg-slate-950/70 
          backdrop-blur-xl 
          rounded-full 
          border border-transparent
          shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50
          relative
        "
            >
                {/* Gradient Border Trick */}
                <div className="absolute inset-0 rounded-full p-[1px] bg-gradient-to-r from-emerald-400 via-sky-400 to-emerald-400 -z-10 opacity-70" />

                {/* Logo Icon */}
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-sky-600 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Sparkles size={20} className="animate-pulse" />
                </div>

                {/* Links */}
                <div className="flex items-center gap-1 mx-2">
                    {MENU_ITEMS.map((item, idx) => (
                        <Link
                            key={idx}
                            href={item.href}
                            className="
                flex items-center gap-2 px-4 py-2.5 rounded-full 
                text-sm font-bold text-slate-700 dark:text-slate-200 
                hover:bg-white/80 dark:hover:bg-white/10 
                transition-all duration-300
                hover:scale-105
              "
                        >
                            <item.icon size={16} className="text-emerald-600 dark:text-emerald-400" />
                            <span className="hidden sm:inline">{item.name}</span>
                        </Link>
                    ))}
                </div>

                {/* CTA Button */}
                <button className="
          bg-slate-900 dark:bg-white 
          text-white dark:text-slate-900 
          px-5 py-2.5 
          rounded-full 
          text-sm font-bold 
          hover:opacity-90 transition-opacity
          shadow-lg
        ">
                    دخول
                </button>
            </motion.nav>
        </div>
    );
}
