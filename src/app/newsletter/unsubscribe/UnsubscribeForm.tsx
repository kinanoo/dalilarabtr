'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Loader2, MailX } from 'lucide-react';

type State = 'idle' | 'loading' | 'success' | 'error';

export default function UnsubscribeForm({ token }: { token?: string }) {
    const [email, setEmail] = useState('');
    const [state, setState] = useState<State>('idle');
    const [message, setMessage] = useState('');

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setState('loading');
        setMessage('');

        try {
            const response = await fetch('/api/newsletter/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(token ? { token } : { email }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) throw new Error(result.error || 'تعذّر إلغاء الاشتراك');
            setState('success');
            setEmail('');
        } catch (error) {
            setState('error');
            setMessage(error instanceof Error ? error.message : 'تعذّر إلغاء الاشتراك');
        }
    };

    if (state === 'success') {
        return (
            <div className="flex flex-col items-center py-5 text-center" role="status">
                <CheckCircle2 className="mb-3 h-12 w-12 text-emerald-600" />
                <h2 className="text-xl font-black text-slate-900 dark:text-white">تم إلغاء الاشتراك</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    لن نرسل رسائل جديدة إلى هذا البريد. يمكنك الاشتراك مجدداً متى شئت.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="flex items-start gap-3">
                <MailX className="mt-0.5 h-6 w-6 shrink-0 text-rose-600" />
                <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white">إلغاء الاشتراك بالنشرة</h1>
                    <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {token
                            ? 'اضغط تأكيد لإيقاف رسائل النشرة لهذا الاشتراك.'
                            : 'أدخل البريد الذي اشتركت به لإيقاف رسائل النشرة.'}
                    </p>
                </div>
            </div>

            {!token && (
                <div>
                    <label htmlFor="unsubscribe-email" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                        البريد الإلكتروني
                    </label>
                    <input
                        id="unsubscribe-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        autoComplete="email"
                        dir="ltr"
                        placeholder="name@example.com"
                        className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-left text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                </div>
            )}

            {state === 'error' && (
                <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300" role="alert">
                    {message}
                </p>
            )}

            <button
                type="submit"
                disabled={state === 'loading'}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 font-black text-white transition hover:bg-rose-700 disabled:cursor-wait disabled:opacity-70"
            >
                {state === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <MailX className="h-5 w-5" />}
                تأكيد إلغاء الاشتراك
            </button>
        </form>
    );
}
