import type { Metadata } from 'next';
import Link from 'next/link';
import UnsubscribeForm from './UnsubscribeForm';

export const metadata: Metadata = {
    title: 'إلغاء الاشتراك بالنشرة',
    description: 'إلغاء رسائل نشرة دليل العرب البريدية.',
    robots: { index: false, follow: false },
};

type Props = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewsletterUnsubscribePage({ searchParams }: Props) {
    const search = await searchParams;
    const rawToken = search.token;
    const token = typeof rawToken === 'string' ? rawToken : undefined;

    return (
        <main className="min-h-[65vh] bg-slate-50 px-4 py-16 dark:bg-slate-950">
            <div className="mx-auto max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                <UnsubscribeForm token={token} />
                <div className="mt-5 border-t border-slate-200 pt-4 text-center dark:border-slate-800">
                    <Link href="/" className="text-sm font-bold text-emerald-700 hover:underline dark:text-emerald-400">
                        العودة إلى الرئيسية
                    </Link>
                </div>
            </div>
        </main>
    );
}
