'use client';

/**
 * ArticleTOC — auto-generated table of contents for long articles.
 *
 * Reads h2/h3 nodes inside a target container element after the article HTML
 * has rendered, assigns stable ids, builds a nav list, and tracks which
 * section is currently in view via IntersectionObserver.
 *
 * The component renders nothing when fewer than three headings are detected
 * (a TOC for two sections looks like noise and hurts UX more than it helps).
 *
 * Layout:
 *   - desktop ≥ lg: sticky sidebar in the parent's grid column
 *   - mobile: collapsible accordion at the top of the article body
 */

import { useEffect, useRef, useState } from 'react';
import { List, ChevronDown } from 'lucide-react';

type Heading = {
    id: string;
    text: string;
    level: 2 | 3;
};

const MIN_HEADINGS = 3;

function slugify(input: string): string {
    return input
        .trim()
        .toLowerCase()
        .replace(/[\s ]+/g, '-')
        // keep Arabic + ASCII alphanumerics + dashes, drop everything else.
        .replace(/[^\w؀-ۿ-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'section';
}

interface Props {
    /** CSS selector of the container that holds the article HTML (h2/h3 inside it). */
    contentSelector: string;
}

export default function ArticleTOC({ contentSelector }: Props) {
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [activeId, setActiveId] = useState<string>('');
    const [mobileOpen, setMobileOpen] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Build the TOC once the article HTML is in the DOM. We retry a few times
    // because dangerouslySetInnerHTML hydrates asynchronously in some flows.
    useEffect(() => {
        let attempts = 0;
        let cancelled = false;

        function build() {
            if (cancelled) return;
            const container = document.querySelector(contentSelector);
            if (!container) {
                if (attempts++ < 10) setTimeout(build, 100);
                return;
            }

            const nodes = Array.from(container.querySelectorAll('h2, h3')) as HTMLHeadingElement[];
            if (nodes.length < MIN_HEADINGS) {
                if (attempts++ < 5) setTimeout(build, 200);
                return;
            }

            const usedIds = new Set<string>();
            const list: Heading[] = nodes.map((node) => {
                let id = node.id;
                if (!id) {
                    id = slugify(node.textContent || '');
                    let suffix = 1;
                    while (usedIds.has(id)) {
                        id = `${slugify(node.textContent || '')}-${++suffix}`;
                    }
                    node.id = id;
                }
                usedIds.add(id);
                node.classList.add('scroll-mt-24');
                return {
                    id,
                    text: (node.textContent || '').trim(),
                    level: (node.tagName === 'H2' ? 2 : 3) as 2 | 3,
                };
            });
            setHeadings(list);

            // Scroll-spy. rootMargin is asymmetric so a heading becomes "active"
            // as it enters the top third of the viewport rather than the bottom
            // edge — feels more natural while reading.
            observerRef.current?.disconnect();
            const obs = new IntersectionObserver(
                (entries) => {
                    const visible = entries.filter((e) => e.isIntersecting);
                    if (visible.length === 0) return;
                    visible.sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
                    setActiveId(visible[0].target.id);
                },
                { rootMargin: '-20% 0px -65% 0px', threshold: 0 }
            );
            nodes.forEach((n) => obs.observe(n));
            observerRef.current = obs;
        }

        build();
        return () => {
            cancelled = true;
            observerRef.current?.disconnect();
        };
    }, [contentSelector]);

    if (headings.length < MIN_HEADINGS) return null;

    function jump(id: string) {
        const el = document.getElementById(id);
        if (!el) return;
        // Collapse the TOC card FIRST, then scroll. The card sits in the flow
        // ABOVE the article body, so collapsing it lifts every heading up by the
        // card's expanded height. If we scrolled first (old order), the smooth
        // scroll aimed at the heading's pre-collapse position and then the
        // collapse pulled the heading up — so it overshot and landed BELOW the
        // target ("ينزلني لتحت اكتر"). Closing first, then scrolling on the next
        // couple of frames (after React commits the collapse and the browser
        // relayouts), targets the heading's SETTLED position — it lands exactly
        // on the heading (scroll-mt-24 keeps it clear of the fixed header).
        setMobileOpen(false);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const target = document.getElementById(id);
            if (!target) return;
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            target.classList.add('toc-flash');
            setTimeout(() => target.classList.remove('toc-flash'), 1200);
        }));
    }

    return (
        <>
            {/*
              Unified collapsible TOC — used on ALL screen sizes.

              Previously we shipped two variants: a collapsible card on
              mobile + a `sticky top-24` desktop sidebar. The sidebar variant
              was placed INSIDE the main `max-w-4xl` reading column (no
              actual side panel existed), so when sticky engaged it occupied
              the full column width and the article body visually scrolled
              behind it. Long articles (e.g. visa types — 13 headings)
              filled the entire viewport and the article footer leaked out
              from underneath. That's the overlap bug.

              Single collapsible card pattern eliminates the class of bug
              completely: the TOC takes only its natural height in flow,
              never sticks, never overlaps. Scroll-spy still updates
              `activeId` (so when expanded, the user sees the current
              section highlighted), but the card is closed by default on
              desktop too — readers click once to skim sections, then
              continue reading.
            */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 overflow-hidden">
                <button
                    type="button"
                    onClick={() => setMobileOpen((v) => !v)}
                    className="w-full flex items-center justify-between p-4 text-right font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    aria-expanded={mobileOpen}
                    aria-controls="toc-list"
                >
                    <span className="flex items-center gap-2">
                        <List size={20} className="text-emerald-600" />
                        محتويات المقال ({headings.length})
                    </span>
                    <ChevronDown
                        size={20}
                        className={`text-slate-500 transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
                    />
                </button>
                {mobileOpen && (
                    <ul
                        id="toc-list"
                        className="border-t border-slate-200 dark:border-slate-700 p-2 max-h-[60vh] overflow-y-auto"
                    >
                        {headings.map((h) => (
                            <li key={h.id}>
                                <button
                                    type="button"
                                    onClick={() => jump(h.id)}
                                    className={`block w-full text-right py-2 px-3 rounded-lg text-sm transition-colors ${
                                        h.level === 3 ? 'pr-7 text-slate-500 dark:text-slate-400' : 'font-bold text-slate-700 dark:text-slate-200'
                                    } ${activeId === h.id ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-r-2 border-emerald-500' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                >
                                    {h.text}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <style jsx global>{`
                /* Landing flash — a warm amber "highlighter" sweep that stands
                   out against the site's emerald-green theme so the reader
                   clearly sees which heading they jumped to. Amber reads on
                   both light and dark backgrounds; the 3px bar sits on the
                   start (right, RTL) edge as a reading-side marker. */
                @keyframes tocFlash {
                    0%   { background-color: rgba(245, 158, 11, 0.30); box-shadow: 4px 0 0 0 rgba(245, 158, 11, 0.95); }
                    70%  { background-color: rgba(245, 158, 11, 0.22); box-shadow: 4px 0 0 0 rgba(245, 158, 11, 0.75); }
                    100% { background-color: transparent; box-shadow: 4px 0 0 0 rgba(245, 158, 11, 0); }
                }
                .toc-flash {
                    animation: tocFlash 1.6s ease-out;
                    border-radius: 8px;
                }
            `}</style>
        </>
    );
}
