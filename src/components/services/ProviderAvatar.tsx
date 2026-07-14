'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { getSupabaseImageUrl } from '@/lib/supabaseImage';

// Coloured-initials avatar with a real onError fallback: if a provider's photo
// URL 404s, we swap to the gradient initials instead of leaving a broken-image
// icon. Colour is stable per name. Shared by ProviderCard + ProviderRow.
const GRADS = [
    'from-emerald-500 to-teal-600', 'from-blue-500 to-cyan-600', 'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600', 'from-sky-500 to-indigo-600',
];
function gradFor(s: string) { let h = 0; for (const c of s || '?') h = (h * 31 + c.charCodeAt(0)) >>> 0; return GRADS[h % GRADS.length]; }
function initials(name: string) { return (name || '؟').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join(''); }

export default function ProviderAvatar({ name, image, className }: { name: string; image: string | null; className?: string }) {
    const optimizedSource = useMemo(
        () => image ? getSupabaseImageUrl(image, { width: 128, height: 128 }) : null,
        [image],
    );
    const [source, setSource] = useState<string | null>(optimizedSource);
    const [err, setErr] = useState(false);

    useEffect(() => {
        setSource(optimizedSource);
        setErr(false);
    }, [optimizedSource]);

    const showImage = source && !err;
    return (
        <div className={`relative overflow-hidden shadow-sm ${className || 'w-14 h-14 rounded-2xl'}`}>
            {showImage ? (
                <Image
                    src={source}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="56px"
                    referrerPolicy="no-referrer"
                    onError={() => {
                        if (image && source !== image) {
                            setSource(image);
                        } else {
                            setErr(true);
                        }
                    }}
                />
            ) : (
                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradFor(name)} text-white font-black`}>
                    {initials(name)}
                </div>
            )}
        </div>
    );
}
