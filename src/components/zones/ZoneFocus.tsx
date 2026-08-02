'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * ZoneFocus — scrolls to and highlights the district the visitor asked for.
 *
 * Neighbourhood names repeat across provinces (CUMHURİYET MAHALLESİ exists in
 * 20 rows), so /zones search results carry ?city=&district= to say which one
 * the reader meant. Resolving that on the SERVER would mean reading
 * `searchParams`, which forces the whole route to render dynamically — and this
 * page runs a ~1,166-row Supabase query, so that cost one full table read per
 * visit on the site's busiest cluster.
 *
 * So the server renders every match (which is what makes the page safe: it
 * never asserts one province's status as the answer), gets prerendered and
 * cached, and this component reads the query string in the browser to take the
 * reader straight to their district. Without JS the page is still correct —
 * just a list the reader scans themselves.
 *
 * The page folds the province into the district label for the ambiguous view
 * ("Şahinbey — Gaziantep"), so match that shape first and fall back to the bare
 * district name for the city/district hub views.
 */
export default function ZoneFocus() {
    const params = useSearchParams();

    useEffect(() => {
        const city = params.get('city');
        const district = params.get('district');
        if (!district) return;

        const wanted = city ? `${district} — ${city}` : district;
        const esc = (s: string) => s.replace(/"/g, '\\"');
        const target =
            document.querySelector<HTMLElement>(`[data-district="${esc(wanted)}"]`) ||
            document.querySelector<HTMLElement>(`[data-district="${esc(district)}"]`);
        if (!target) return;

        // Two frames: let the layout settle before measuring, or the scroll
        // lands short on mobile where fonts and images shift the first frame.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target.classList.add('zone-focus-flash');
                window.setTimeout(() => target.classList.remove('zone-focus-flash'), 2200);
            });
        });
    }, [params]);

    return (
        <style>{`
            .zone-focus-flash {
                animation: zone-focus 2.2s ease-out 1;
                border-radius: 0.75rem;
            }
            @keyframes zone-focus {
                0%   { background-color: rgba(245, 158, 11, 0.20); box-shadow: inset 4px 0 0 rgba(245, 158, 11, 0.9); }
                70%  { background-color: rgba(245, 158, 11, 0.10); box-shadow: inset 4px 0 0 rgba(245, 158, 11, 0.5); }
                100% { background-color: transparent; box-shadow: inset 4px 0 0 transparent; }
            }
            @media (prefers-reduced-motion: reduce) {
                .zone-focus-flash { animation-duration: 0.01ms; }
            }
        `}</style>
    );
}
