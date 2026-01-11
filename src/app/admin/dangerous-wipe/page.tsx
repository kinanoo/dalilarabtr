'use client';

import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';

export default function WipeReviewsPage() {
    const [status, setStatus] = useState('Idle');

    const handleWipe = async () => {
        if (!confirm('ARE YOU SURE? THIS WILL DELETE ALL REVIEWS FOREVER.')) return;

        setStatus('Wiping...');
        try {
            const { error: revError } = await supabase.from('service_reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (revError) throw revError;

            // Also wipe votes if cascade doesn't handle it (it usually should, but let's be safe if we can)
            // Actually usually cascade handles it.

            setStatus('✅ All reviews deleted successfully.');
        } catch (e: any) {
            setStatus('❌ Error: ' + e.message);
        }
    };

    return (
        <div className="p-20 flex flex-col items-center justify-center gap-8 bg-red-950 text-white min-h-screen">
            <h1 className="text-4xl font-bold">⚠️ DANGER ZONE ⚠️</h1>
            <p>This button wipes the entire <code>service_reviews</code> table.</p>

            <button
                onClick={handleWipe}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-2xl font-black shadow-xl"
            >
                💣 DELETE ALL REVIEWS
            </button>

            <div className="text-xl font-mono">{status}</div>
        </div>
    );
}
