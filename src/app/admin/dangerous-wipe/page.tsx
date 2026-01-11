'use client';

import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';

export default function WipeReviewsPage() {
    const [status, setStatus] = useState('Idle');

    const handleWipe = async () => {
        if (!confirm('هل أنت متأكد؟ سيتم حذف جميع التقييمات وتصفير العدادات لجميع المتاجر!')) return;

        setStatus('جاري الحذف والتصفير...');
        try {
            // 1. Delete all reviews
            const { error: revError } = await supabase.from('service_reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (revError) throw revError;

            // 2. Reset Stats for ALL providers
            const { error: provError } = await supabase
                .from('service_providers')
                .update({ rating_avg: 0, review_count: 0 })
                .neq('id', '00000000-0000-0000-0000-000000000000');

            if (provError) throw provError;

            setStatus('✅ تم حذف التقييمات وتصفير العدادات بنجاح.');
        } catch (e: any) {
            setStatus('❌ خطأ: ' + e.message);
        }
    };

    return (
        <div className="p-20 flex flex-col items-center justify-center gap-8 bg-red-950 text-white min-h-screen">
            <h1 className="text-4xl font-bold">⚠️ منطقة الخطر ⚠️</h1>
            <p className="text-xl">هذا الزر سيقوم بحذف جدول <code>Reviews</code> وتصفير تقييمات كل مقدمي الخدمة.</p>

            <button
                onClick={handleWipe}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-2xl font-black shadow-xl"
            >
                💣 حذف وتصفير شامل
            </button>

            <div className="text-xl font-mono">{status}</div>
        </div>
    );
}
