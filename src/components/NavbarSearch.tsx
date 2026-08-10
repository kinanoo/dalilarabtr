'use client';

import { Search } from 'lucide-react';
import { useSearchDialog } from '@/components/search/SearchDialogProvider';

/**
 * Search in the navbar — on every page, not just the homepage.
 *
 * The site had exactly one search box, on the homepage hero. But most visitors
 * arrive from Google straight onto an article, and from there the only way to
 * look for anything else was to go back to Google. The header slot for this had
 * literally been left as `{/* Search Removed *\/}`.
 *
 * The heavy search index is still lazy: SearchDialogProvider mounts it only
 * after this button (or the hero search button) is used.
 */

export default function NavbarSearch() {
    const { isSearchOpen, openSearch } = useSearchDialog();

    return (
        <button
            type="button"
            onClick={openSearch}
            aria-label="ابحث في الموقع"
            aria-haspopup="dialog"
            aria-expanded={isSearchOpen}
            className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2.5 text-white transition-colors hover:bg-white/15"
        >
            <Search size={20} aria-hidden="true" />
            <span className="hidden text-xs font-bold lg:inline">بحث</span>
        </button>
    );
}
