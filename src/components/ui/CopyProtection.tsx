'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function CopyProtection() {
    const pathname = usePathname();
    const { user } = useAuth();

    useEffect(() => {
        // Admin pages — no protection
        if (pathname?.startsWith('/admin')) return;

        // If user is logged in (admin), allow everything
        if (user) return;

        // ── Block copy for non-admin users ──

        const handleCopy = (e: ClipboardEvent) => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) return;

            const anchor = sel.anchorNode;
            if (!anchor) { e.preventDefault(); return; }

            // Allow copying from inputs/textareas (search, forms)
            const el = anchor.nodeType === Node.ELEMENT_NODE
                ? anchor as Element
                : anchor.parentElement;
            if (el?.closest('input, textarea, [contenteditable]')) return;

            // Allow copying from article title (h1) only
            if (el?.closest('h1')) return;

            // Block everything else — silently
            e.preventDefault();
        };

        // Block right-click context menu on content areas
        const handleContext = (e: MouseEvent) => {
            const t = e.target as HTMLElement;
            if (t.closest('input, textarea, [contenteditable], h1')) return;
            // Allow context menu on links (users may want "open in new tab")
            if (t.closest('a, button, nav')) return;
            e.preventDefault();
        };

        // Block drag (prevents drag-select-drop to extract text)
        const handleDragStart = (e: DragEvent) => {
            const t = e.target as HTMLElement;
            // Allow dragging images/links
            if (t.tagName === 'IMG' || t.tagName === 'A') return;
            e.preventDefault();
        };

        // Block keyboard shortcuts (Ctrl+A, Ctrl+C, Ctrl+U, Ctrl+S, F12)
        const handleKeyDown = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement;
            const tag = t.tagName;
            // Allow all shortcuts inside inputs/textareas
            if (tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable) return;

            const ctrl = e.ctrlKey || e.metaKey;

            // Block Ctrl+A (select all) outside inputs
            if (ctrl && e.key === 'a') { e.preventDefault(); return; }
            // Block Ctrl+C (copy) outside inputs — except in h1
            if (ctrl && e.key === 'c') {
                if (!t.closest?.('h1')) { e.preventDefault(); return; }
            }
            // Block Ctrl+U (view source)
            if (ctrl && e.key === 'u') { e.preventDefault(); return; }
            // Block Ctrl+S (save page)
            if (ctrl && e.key === 's') { e.preventDefault(); return; }
            // Block Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (devtools)
            if (ctrl && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) {
                e.preventDefault(); return;
            }
            // Block F12
            if (e.key === 'F12') { e.preventDefault(); return; }
        };

        // CSS-based protection: make body text unselectable except h1 and inputs
        const style = document.createElement('style');
        style.id = '_cp_style';
        style.textContent = `
            body { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
            h1, input, textarea, [contenteditable], button, a, nav, select,
            h1 *, input *, textarea * { -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text; user-select: text; }
        `;
        document.head.appendChild(style);

        document.addEventListener('copy', handleCopy, true);
        document.addEventListener('contextmenu', handleContext, true);
        document.addEventListener('dragstart', handleDragStart, true);
        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            document.removeEventListener('copy', handleCopy, true);
            document.removeEventListener('contextmenu', handleContext, true);
            document.removeEventListener('dragstart', handleDragStart, true);
            document.removeEventListener('keydown', handleKeyDown, true);
            document.getElementById('_cp_style')?.remove();
        };
    }, [pathname, user]);

    return null;
}
