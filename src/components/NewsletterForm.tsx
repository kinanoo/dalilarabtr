'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, Loader2 } from 'lucide-react';
import { newsletterSchema, type NewsletterInputs } from '@/lib/schemas';

interface NewsletterFormProps {
    onSubmit?: (email: string) => void;
}

export default function NewsletterForm({ onSubmit }: NewsletterFormProps) {
    const [message, setMessage] = useState('');

    // 1. Setup Form with Zod Resolver
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<NewsletterInputs>({
        resolver: zodResolver(newsletterSchema),
    });

    // 2. Handle Valid Submission
    const onValidSubmit = async (data: NewsletterInputs) => {
        setMessage('');

        try {
            if (onSubmit) {
                await onSubmit(data.email);
            }

            setMessage('شكراً لاشتراكك! ✨');
            reset(); // Clear input

            // Haptic feedback
            if ('vibrate' in navigator) navigator.vibrate([50]);

        } catch (error) {
            setMessage('حدث خطأ. حاول مرة أخرى.');
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit(onValidSubmit)} className="flex gap-2 isolate relative">
                <div className="flex-1 relative">
                    <input
                        type="email"
                        aria-label="البريد الإلكتروني للاشتراك"
                        {...register('email')}
                        placeholder="بريدك الإلكتروني"
                        disabled={isSubmitting}
                        className={`
                            w-full px-4 py-3
                            bg-white dark:bg-slate-800
                            border ${errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}
                            rounded-xl
                            text-slate-900 dark:text-slate-100
                            placeholder:text-slate-400
                            focus:outline-none focus:ring-2 ${errors.email ? 'focus:ring-red-500' : 'focus:ring-emerald-500'}
                            disabled:opacity-50
                            transition-all
                        `}
                    />
                    {errors.email && (
                        <p className="absolute -bottom-6 right-0 text-xs text-red-500 font-bold animate-in slide-in-from-top-1">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="
                        px-4 py-2
                        bg-emerald-600 hover:bg-emerald-700
                        text-white
                        rounded-xl
                        transition-all
                        btn-hover-lift
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                        flex items-center justify-center
                        min-w-[50px]
                    "
                    aria-label="اشترك"
                >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
            </form>

            {!errors.email && message && (
                <p className={`mt-2 text-sm ${message.includes('شكراً') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
