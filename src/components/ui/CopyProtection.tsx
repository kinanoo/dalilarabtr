'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export default function CopyProtection() {
    useEffect(() => {
        const handleCopy = (e: ClipboardEvent) => {
            // Check if what is being copied is text
            const selection = window.getSelection();
            if (selection && selection.toString().length > 0) {
                e.preventDefault();
                toast.warning('⚠️ تم تعطيل النسخ المباشر!', {
                    description: 'يرجى استخدام قائمة المشاركة الذكية لنسخ النص مع الرابط وحفظ الحقوق.',
                    duration: 4000,
                    action: {
                        label: 'فهمت',
                        onClick: () => { }
                    }
                });
            }
        };

        document.addEventListener('copy', handleCopy);
        return () => document.removeEventListener('copy', handleCopy);
    }, []);

    return null;
}
