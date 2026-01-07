'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Award } from 'lucide-react';

export default function ContributorsList({ articleId }: { articleId: string }) {
    const [contributors, setContributors] = useState<string[]>([]);

    useEffect(() => {
        if (!articleId) return;

        async function fetchContributors() {
            if (!supabase) return;
            // Fetch suggestions that are 'approved' or 'implemented'
            const { data } = await supabase
                .from('content_suggestions')
                .select('user_name')
                .eq('article_id', articleId)
                .or('status.eq.approved,status.eq.implemented')
                .not('user_name', 'is', null);

            if (data && data.length > 0) {
                // Unique names
                const names = Array.from(new Set(data.map(d => d.user_name).filter(Boolean))) as string[];
                setContributors(names);
            }
        }

        fetchContributors();
    }, [articleId]);

    if (contributors.length === 0) return null;

    return (
        <div className="mt-8 mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-full text-emerald-600 dark:text-emerald-300">
                <Award size={20} />
            </div>
            <div>
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm mb-1">
                    لوحة شرف المساهمين 🏅
                </h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    تم تحديث وتنقيح هذا الدليل بمساهمة قيمة من:
                    <span className="font-bold mr-1">
                        {contributors.join('، ')}
                    </span>
                    . شكراً لمشاركتكم في نشر المنفعة!
                </p>
            </div>
        </div>
    );
}
