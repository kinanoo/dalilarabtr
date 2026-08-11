'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { getSupabaseImageUrl } from '@/lib/supabaseImage';

// Neutral-initials avatar with a real onError fallback: if a provider's photo
// URL fails, keep the directory calm and show initials instead of a broken image.
function initials(name: string) { return (name || '؟').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join(''); }

function ProviderAvatarImage({
    name,
    image,
    optimizedSource,
    className,
}: {
    name: string;
    image: string;
    optimizedSource: string;
    className?: string;
}) {
    const [source, setSource] = useState<string | null>(optimizedSource);
    const [err, setErr] = useState(false);

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
                <div className="flex h-full w-full items-center justify-center bg-slate-100 font-black text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700">
                    {initials(name)}
                </div>
            )}
        </div>
    );
}

export default function ProviderAvatar({ name, image, className }: { name: string; image: string | null; className?: string }) {
    const optimizedSource = useMemo(
        () => image ? getSupabaseImageUrl(image, { width: 128, height: 128 }) : null,
        [image],
    );

    if (!image || !optimizedSource) {
        return (
            <div className={`relative overflow-hidden shadow-sm ${className || 'w-14 h-14 rounded-2xl'}`}>
                <div className="flex h-full w-full items-center justify-center bg-slate-100 font-black text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700">
                    {initials(name)}
                </div>
            </div>
        );
    }

    return (
        <ProviderAvatarImage
            key={optimizedSource}
            name={name}
            image={image}
            optimizedSource={optimizedSource}
            className={className}
        />
    );
}
