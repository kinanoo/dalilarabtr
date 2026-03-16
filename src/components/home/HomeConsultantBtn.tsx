'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function HomeConsultantBtn() {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/consultant">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-base font-bold rounded-xl shadow-lg hover:shadow-2xl hover:shadow-emerald-400/50 transition-all duration-300 flex items-center gap-2"
                >
                    <span>ابدأ مع المستشار الذكي</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </motion.button>
            </Link>
        </div>
    );
}
