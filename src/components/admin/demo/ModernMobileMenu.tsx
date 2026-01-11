'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Menu, LayoutDashboard, FileText, Briefcase,
    Bell, Star, MessageSquare, Settings, LogOut,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';

// Dummy Menu Items
const menuItems = [
    { icon: LayoutDashboard, label: 'الرئيسية', href: '#' },
    { icon: Briefcase, label: 'الخدمات', href: '#' },
    { icon: FileText, label: 'المقالات', href: '#' },
    { icon: Bell, label: 'التحديثات', href: '#' },
    { icon: Star, label: 'التقييمات', href: '#' },
    { icon: MessageSquare, label: 'المجتمع', href: '#' },
    { icon: Settings, label: 'الإعدادات', href: '#' },
];

export function ModernMobileMenu() {
    const [isOpen, setIsOpen] = useState(false);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    return (
        <div className="relative">
            {/* 1. The Sticky App Bar (Floating Island for Demo) */}
            <div className="fixed top-4 left-4 right-4 z-[90] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold shadow-emerald-500/20 shadow-lg">
                        D
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-800 dark:text-white leading-tight">لوحة التحكم</h1>
                        <p className="text-[10px] text-slate-500 font-mono">Mobile Genius V2</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsOpen(true)}
                    className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
                >
                    <Menu size={20} />
                </button>
            </div>

            {/* 2. The Full Screen Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="absolute inset-y-0 right-0 w-[85%] max-w-sm bg-white dark:bg-slate-950 shadow-2xl overflow-y-auto"
                            onClick={e => e.stopPropagation()} // Stop close on content click
                        >
                            {/* Drawer Header */}
                            <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
                                <span className="font-black text-xl text-slate-800 dark:text-white tracking-tight">القائمة</span>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-10 h-10 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Drawer Content - Interactive Grid */}
                            <div className="p-4 space-y-2">
                                {menuItems.map((item, idx) => (
                                    <motion.a
                                        key={idx}
                                        href={item.href}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 active:scale-95 transition-all group border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-emerald-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
                                            <item.icon size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-lg text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                {item.label}
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-[-4px] transition-all" />
                                    </motion.a>
                                ))}
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-6 mt-4 border-t border-slate-100 dark:border-slate-800/50">
                                <button className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 font-bold hover:bg-red-100 transition-colors">
                                    <LogOut size={20} />
                                    تسجيل الخروج
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
