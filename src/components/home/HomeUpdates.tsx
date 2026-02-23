'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, ArrowLeft, Calendar, Sparkles } from 'lucide-react';

function isNewContent(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
}

export default function HomeUpdates({ updates }: { updates: any[] }) {
    // Construct base list safely
    if (!updates || updates.length === 0) return null;

    const minBaseCount = 5; // Reduced from 10 to save DOM nodes
    let baseList = [...updates];
    while (baseList.length < minBaseCount) {
        baseList = [...baseList, ...updates];
    }

    return (
        <section className="py-12 border-b border-slate-100 dark:border-slate-800/50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-amber-600 animate-pulse-slow">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            شريط التحديثات
                        </h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            أحدث الأخبار والقوانين الصادرة في تركيا
                        </p>
                    </div>
                </div>

                <Link
                    href="/updates"
                    className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-4 py-2 rounded-xl transition flex items-center gap-2 group"
                >
                    عرض السجل الكامل
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* Marquee Wrapper */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 group" dir="ltr">
                    {/* Gradient Masks */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />

                    {/* Track Container with custom CSS animation class */}
                    <div className="flex w-max relative group-hover:paused">
                        {/* Define inline keyframes to mimic the loop */}
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            @keyframes ticker-scroll {
                                0% { transform: translateX(0); }
                                100% { transform: translateX(-50%); }
                            }
                            .animate-ticker-scroll {
                                animation: ticker-scroll 40s linear infinite;
                            }
                            .group:hover .animate-ticker-scroll {
                                animation-play-state: paused;
                            }
                        `}} />
                        <div className="flex w-max animate-ticker-scroll py-4">
                            {/* List 1 */}
                            <div className="flex items-center gap-4 pr-4 shrink-0">
                                {baseList.map((update, index) => (
                                    <UpdateCard key={`l1-${update.id}-${index}`} update={update} onClick={(e) => { }} />
                                ))}
                            </div>

                            {/* List 2 (Replica for seamless loop — hidden from screen readers) */}
                            <div className="flex items-center gap-4 pr-4 shrink-0" aria-hidden="true">
                                {baseList.map((update, index) => (
                                    <UpdateCard key={`l2-${update.id}-${index}`} update={update} onClick={(e) => { }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Subcomponent for cleaner code
function UpdateCard({ update, onClick }: { update: any, onClick: (e: React.MouseEvent) => void }) {
    return (
        <Link
            href={`/updates#upd-${update.id}`}
            draggable="false" // Prevent native drag link behavior
            onClick={onClick}
            className="block w-[280px] md:w-[350px] h-[120px] flex-shrink-0 bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors group relative overflow-hidden"
            dir="rtl"
        >
            <div className="flex items-start gap-4 h-full">
                {update.image && (
                    <div className="relative w-24 h-full flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <Image
                            src={update.image}
                            alt={update.title || "صورة الخبر"}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500 select-none pointer-events-none"
                            sizes="80px"
                        />
                    </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${update.type === 'هام' || update.type === 'عاجل'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                {update.type}
                            </span>
                            {isNewContent(update.date) && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    <Sparkles size={10} /> جديد
                                </span>
                            )}
                        </div>

                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors">
                            {update.title}
                        </h3>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar size={12} /> {update.date}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1">
                            اقرأ المزيد <ArrowLeft size={10} />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
