'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

export default function CopyProtection() {
    const pathname = usePathname();
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);

    // Check if user is actually admin (role check, not just logged in)
    useEffect(() => {
        if (!user || !supabase) { setIsAdmin(false); return; }
        supabase
            .from('member_profiles')
            .select('role')
            .eq('id', user.id)
            .single()
            .then(({ data }) => {
                setIsAdmin(data?.role === 'admin');
            });
    }, [user]);

    useEffect(() => {
        // Admin pages — no protection
        if (pathname?.startsWith('/admin')) return;

        // If user is admin, allow everything
        if (isAdmin) return;

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
            if (t.closest('a, button, nav')) return;
            e.preventDefault();
        };

        // Block drag (prevents drag-select-drop to extract text)
        const handleDragStart = (e: DragEvent) => {
            const t = e.target as HTMLElement;
            if (t.tagName === 'IMG' || t.tagName === 'A') return;
            e.preventDefault();
        };

        // Block keyboard shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement;
            const tag = t.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable) return;

            const ctrl = e.ctrlKey || e.metaKey;

            if (ctrl && e.key === 'a') { e.preventDefault(); return; }
            if (ctrl && e.key === 'c') {
                if (!t.closest?.('h1')) { e.preventDefault(); return; }
            }
            if (ctrl && e.key === 'u') { e.preventDefault(); return; }
            if (ctrl && e.key === 's') { e.preventDefault(); return; }
            if (ctrl && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) {
                e.preventDefault(); return;
            }
            if (e.key === 'F12') { e.preventDefault(); return; }
        };

        // Block print (Ctrl+P)
        const handleBeforePrint = () => {
            document.body.style.display = 'none';
            setTimeout(() => { document.body.style.display = ''; }, 100);
        };

        // CSS: only block print, keep text selectable (copy is blocked via JS)
        const style = document.createElement('style');
        style.id = '_cp_style';
        style.textContent = `
            @media print { body { display: none !important; } }
        `;
        document.head.appendChild(style);

        document.addEventListener('copy', handleCopy, true);
        document.addEventListener('contextmenu', handleContext, true);
        document.addEventListener('dragstart', handleDragStart, true);
        document.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('beforeprint', handleBeforePrint);

        return () => {
            document.removeEventListener('copy', handleCopy, true);
            document.removeEventListener('contextmenu', handleContext, true);
            document.removeEventListener('dragstart', handleDragStart, true);
            document.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('beforeprint', handleBeforePrint);
            document.getElementById('_cp_style')?.remove();
        };
    }, [pathname, isAdmin]);

    return null;
}
