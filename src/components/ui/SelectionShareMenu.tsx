'use client';

import { useState, useEffect } from 'react';
import { Twitter, Facebook, Link as LinkIcon, MessageCircle, Quote } from 'lucide-react';
import { toast } from 'sonner';

export default function SelectionShareMenu() {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [selectedText, setSelectedText] = useState('');

    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();

            // Validate selection
            if (!selection || selection.isCollapsed || selection.toString().trim().length < 3) {
                setVisible(false);
                return;
            }

            const text = selection.toString().trim();
            setSelectedText(text);

            // Calculate Position
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Check if selection is inside our own menu (prevent loop) or input/textarea
            if (
                selection.anchorNode?.parentElement?.closest('input, textarea') ||
                selection.anchorNode?.parentElement?.closest('#selection-share-menu')
            ) {
                setVisible(false);
                return;
            }

            // Position centered above selection
            // Using viewport coordinates for 'fixed' positioning
            let top = rect.top - 60; // 60px above selection
            let left = rect.left + (rect.width / 2) - 100; // Center horizontally (assuming ~200px width)

            // 1. Vertical Safety Check (If too close to top, show below selection)
            if (top < 10) {
                top = rect.bottom + 10;
            }

            // 2. Horizontal Safety Check (Keep within screen bounds)
            const menuWidth = 200; // Approximate
            const screenWidth = window.innerWidth;

            if (left < 10) left = 10;
            if (left + menuWidth > screenWidth - 10) {
                left = screenWidth - menuWidth - 10;
            }

            setPosition({ top, left });
            setVisible(true);
        };

        // Debounce slightly to smooth out rapid selection changes
        let timeout: NodeJS.Timeout;
        const debouncedHandler = () => {
            clearTimeout(timeout);
            timeout = setTimeout(handleSelectionChange, 100);
        };

        document.addEventListener('selectionchange', debouncedHandler);
        // Also listen to mouseup for precise end-of-drag positioning
        document.addEventListener('mouseup', debouncedHandler);

        return () => {
            document.removeEventListener('selectionchange', debouncedHandler);
            document.removeEventListener('mouseup', debouncedHandler);
        };
    }, []);

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    const handleShare = (platform: 'whatsapp' | 'twitter' | 'facebook' | 'copy') => {
        const encodedText = encodeURIComponent(`"${selectedText}"`);
        const encodedUrl = encodeURIComponent(currentUrl);

        if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodedText}%20-%20${encodedUrl}`, '_blank');
        } else if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
        } else if (platform === 'facebook') {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`, '_blank');
        } else if (platform === 'copy') {
            const textToCopy = `${selectedText}\n\nاقرأ المزيد: ${currentUrl}`;
            if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(textToCopy)
                    .then(() => toast.success('تم نسخ النص مع الرابط! 🔗'))
                    .catch(() => toast.error('فشل النسخ'));
            } else {
                try {
                    const textArea = document.createElement("textarea");
                    textArea.value = textToCopy;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    toast.success('تم نسخ النص مع الرابط! 🔗');
                } catch (err) {
                    toast.error('هذا المتصفح لا يدعم النسخ التلقائي');
                }
            }
        }

        // Hide after action
        setVisible(false);
        window.getSelection()?.removeAllRanges();
    };

    if (!visible) return null;

    return (
        <div
            id="selection-share-menu"
            className="fixed z-50 flex items-center gap-1 bg-slate-900 text-white p-2 rounded-full shadow-xl shadow-slate-900/20 animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: position.top,
                left: position.left,
                transform: 'translateX(0)' // Position is already centered manually
            }}
        >
            {/* Arrow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45"></div>

            <button onClick={() => handleShare('whatsapp')} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-emerald-400" title="شارك عبر واتساب">
                <MessageCircle size={18} />
            </button>
            <div className="w-px h-4 bg-slate-700"></div>

            <button onClick={() => handleShare('twitter')} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-sky-400" title="شارك عبر X">
                <Twitter size={18} />
            </button>
            <div className="w-px h-4 bg-slate-700"></div>

            <button onClick={() => handleShare('facebook')} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-blue-500" title="شارك عبر فيسبوك">
                <Facebook size={18} />
            </button>
            <div className="w-px h-4 bg-slate-700"></div>

            <button onClick={() => handleShare('copy')} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-amber-500" title="نسخ مع الرابط">
                <LinkIcon size={18} />
            </button>
        </div>
    );
}
