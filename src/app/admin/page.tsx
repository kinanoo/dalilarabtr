'use client';

import { useState } from 'react';
import {
  FileText,
  ShieldAlert,
  Zap,
  Newspaper,
  Megaphone,
  Sparkles,
  Bot,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { GlobalSearch } from '@/components/admin/GlobalSearch';

import { ActionCenter } from '@/components/admin/ActionCenter';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import NewsTickerManager from '@/components/admin/NewsTickerManager';
import { AIAssistant } from '@/components/admin/AIAssistant';
import { motion } from 'framer-motion';

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren"
    }
  }
};

const itemVariants: any = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const COLOR_MAP: Record<string, { bg: string; border: string; hoverBg: string; darkHoverBg: string; iconBg: string; darkIconBg: string; iconText: string; darkIconText: string }> = {
  blue:    { bg: 'hover:bg-blue-50',    border: 'hover:border-blue-500',    hoverBg: 'hover:bg-blue-50',    darkHoverBg: 'dark:hover:bg-blue-950/20',    iconBg: 'bg-blue-100',    darkIconBg: 'dark:bg-blue-900/30',    iconText: 'text-blue-600',    darkIconText: 'dark:text-blue-400' },
  violet:  { bg: 'hover:bg-violet-50',  border: 'hover:border-violet-500',  hoverBg: 'hover:bg-violet-50',  darkHoverBg: 'dark:hover:bg-violet-950/20',  iconBg: 'bg-violet-100',  darkIconBg: 'dark:bg-violet-900/30',  iconText: 'text-violet-600',  darkIconText: 'dark:text-violet-400' },
  emerald: { bg: 'hover:bg-emerald-50', border: 'hover:border-emerald-500', hoverBg: 'hover:bg-emerald-50', darkHoverBg: 'dark:hover:bg-emerald-950/20', iconBg: 'bg-emerald-100', darkIconBg: 'dark:bg-emerald-900/30', iconText: 'text-emerald-600', darkIconText: 'dark:text-emerald-400' },
  red:     { bg: 'hover:bg-red-50',     border: 'hover:border-red-500',     hoverBg: 'hover:bg-red-50',     darkHoverBg: 'dark:hover:bg-red-950/20',     iconBg: 'bg-red-100',     darkIconBg: 'dark:bg-red-900/30',     iconText: 'text-red-600',     darkIconText: 'dark:text-red-400' },
};

const QuickActionBtn = ({ title, icon: Icon, color, href }: { title: string; icon: React.ElementType; color: string; href: string }) => {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <Link href={href} className="block h-full">
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        className={`h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 ${c.border} ${c.hoverBg} ${c.darkHoverBg} transition-all shadow-sm hover:shadow-xl`}
      >
        <div className={`p-4 rounded-full ${c.iconBg} ${c.darkIconBg} ${c.iconText} ${c.darkIconText} mb-3 group-hover:scale-110 transition-transform`}>
          <Icon size={32} />
        </div>
        <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">{title}</span>
      </motion.div>
    </Link>
  );
};

export default function AdminDashboard() {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 sm:p-8 max-w-7xl mx-auto space-y-10 min-h-screen"
    >

      {/* 1. Hero / Search Section */}
      <motion.div variants={itemVariants} className="text-center space-y-6 pt-4 sm:pt-8 pb-4">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">مرحباً، المدير العام 👋</h1>
          <p className="text-slate-500 font-medium">ابدأ بالبحث عن أي شيء أو راجع المهام المعلقة أدناه</p>
        </div>

        {/* The Genius Search Bar */}
        <div className="relative">
          <GlobalSearch />
        </div>
      </motion.div>

      {/* 2. Action Center (Notifications & Tasks) */}
      <motion.section variants={itemVariants}>
        <ActionCenter />
      </motion.section>

      {/* 3. Analytics Dashboard */}
      <motion.section variants={itemVariants}>
        <AnalyticsDashboard />
      </motion.section>

      {/* 4. News Ticker Manager */}
      <motion.section variants={itemVariants}>
        <NewsTickerManager />
      </motion.section>

      {/* 5. AI Assistant Card */}
      <motion.section variants={itemVariants}>
        <button
          type="button"
          onClick={() => setAiOpen(true)}
          className="w-full text-right group"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-blue-600 via-indigo-600 to-violet-700 p-5 sm:p-7 shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all active:scale-[0.99]">
            {/* Decorative circles */}
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Bot size={28} className="text-white sm:hidden" />
                <Sparkles size={32} className="text-white hidden sm:block" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-white mb-1">المساعد الذكي</h3>
                <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                  ابحث، أنشئ مقالات، عدّل، احذف — أي شيء تحتاجه بأمر واحد
                </p>
              </div>
              <ArrowLeft size={24} className="text-white/60 group-hover:text-white group-hover:-translate-x-1 transition-all shrink-0" />
            </div>

            {/* Example chips */}
            <div className="relative mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
              {['أنشئ خبر جديد', 'إحصائيات الموقع', 'تعليقات معلقة'].map(ex => (
                <span key={ex} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/15 text-white text-[11px] font-medium backdrop-blur-sm">
                  {ex}
                </span>
              ))}
            </div>
          </div>
        </button>
        <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
      </motion.section>

      {/* 6. Quick Actions Grid */}
      <motion.section variants={itemVariants}>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <Zap className="text-yellow-500" />
          وصول سريع
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <QuickActionBtn href="/admin/news-ticker" title="شريط الأخبار" icon={Newspaper} color="blue" />
          <QuickActionBtn href="/admin/updates" title="التحديثات" icon={Megaphone} color="violet" />
          <QuickActionBtn href="/admin/articles" title="المقالات" icon={FileText} color="emerald" />
          <QuickActionBtn href="/admin/banners" title="البنرات" icon={ShieldAlert} color="red" />
        </div>
      </motion.section>

    </motion.div>
  );
}
