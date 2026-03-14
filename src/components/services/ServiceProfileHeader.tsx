'use client';

import { CheckCircle2, MapPin, Share2, Star } from 'lucide-react';
import Image from 'next/image';

// === Type Definitions ===
interface Service {
    name: string;
    image?: string;
    is_verified?: boolean;
    profession: string;
    city: string;
    district?: string;
    rating_avg?: number | string;
    review_count?: number;
    category: string;
}

interface HeaderProps {
    service: Service;
}

export default function ServiceProfileHeader({ service }: HeaderProps) {
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: service.name,
                text: `تحقق من بروفايل ${service.name} على دليل العرب في تركيا`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('تم نسخ الرابط!');
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pb-8 pt-24 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-r from-emerald-600 to-teal-700 opacity-90" />

            <div className="container mx-auto px-4 relative">
                <div className="flex flex-col md:flex-row items-start gap-6 pt-10">
                    {/* Image */}
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-white dark:border-slate-900 shadow-lg overflow-hidden shrink-0 bg-slate-100 relative z-10">
                        {service.image ? (
                            <Image
                                src={service.image}
                                alt={service.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 128px, 160px"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-300 bg-slate-100 dark:bg-slate-800 uppercase">
                                {service.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 pt-2 md:pt-12">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                    {service.name}
                                    {service.is_verified && (
                                        <CheckCircle2 className="text-blue-500 fill-blue-50" size={24} />
                                    )}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-1">
                                    {service.profession}
                                </p>
                            </div>

                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 font-bold transition-colors"
                            >
                                <Share2 size={18} />
                                <span>مشاركة البروفايل</span>
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                                <MapPin size={16} />
                                {service.city} {service.district && `، ${service.district}`}
                            </div>
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                                <Star size={16} fill="currentColor" />
                                <span>{service.rating_avg ? Number(service.rating_avg).toFixed(1) : '0.0'}</span>
                                <span className="text-slate-400 font-normal underline decoration-dashed ml-1">
                                    ({service.review_count || 0} تقييم)
                                </span>
                            </div>
                            <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs border border-slate-200 dark:border-slate-700">
                                {service.category}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
