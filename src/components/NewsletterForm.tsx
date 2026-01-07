'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface NewsletterFormProps {
    onSubmit?: (email: string) => void;
}

export default function NewsletterForm({ onSubmit }: NewsletterFormProps) {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setMessage('الرجاء إدخال بريدك الإلكتروني');
            return;
        }

        setIsSubmitting(true);
        setMessage('');

        try {
            if (onSubmit) {
                await onSubmit(email);
            }

            setMessage('شكراً لاشتراكك! ✨');
            setEmail('');

            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 50, 50]);
            }
        } catch (error) {
            setMessage('حدث خطأ. حاول مرة أخرى.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="بريدك الإلكتروني"
                    disabled={isSubmitting}
                    className="
            flex-1 px-4 py-2
            bg-white dark:bg-slate-800
            border border-slate-300 dark:border-slate-700
            rounded-lg
            text-slate-900 dark:text-slate-100
            placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-emerald-500
            disabled:opacity-50
          "
                />

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="
            px-4 py-2
            bg-emerald-600 hover:bg-emerald-700
            text-white
            rounded-lg
            transition-all
            btn-hover-lift
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
                    aria-label="اشترك"
                >
                    <Send size={20} />
                </button>
            </form>

            {message && (
                <p className={`mt-2 text-sm ${message.includes('شكراً') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
