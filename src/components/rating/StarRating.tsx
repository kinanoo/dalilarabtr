'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
    rating: number; // 0 to 5
    max?: number;
    size?: number;
    interactive?: boolean;
    onChange?: (val: number) => void;
}

export default function StarRating({
    rating,
    max = 5,
    size = 16,
    interactive = false,
    onChange
}: StarRatingProps) {
    const [hoverVal, setHoverVal] = useState<number | null>(null);

    return (
        <div className="flex items-center gap-0.5" dir="ltr">
            {Array.from({ length: max }).map((_, i) => {
                const val = i + 1;
                const isFilled = (hoverVal || rating) >= val;

                return (
                    <button
                        key={i}
                        type="button"
                        disabled={!interactive}
                        onClick={() => interactive && onChange?.(val)}
                        onMouseEnter={() => interactive && setHoverVal(val)}
                        onMouseLeave={() => interactive && setHoverVal(null)}
                        className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
                    >
                        <Star
                            size={size}
                            className={`${isFilled ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 dark:fill-slate-800 text-slate-300 dark:text-slate-700'}`}
                        />
                    </button>
                );
            })}
        </div>
    );
}
