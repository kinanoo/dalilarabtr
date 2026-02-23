import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '404 - الصفحة غير موجودة | دليل العرب في تركيا',
    description: 'الصفحة التي تبحث عنها غير موجودة أو تم حذفها.',
    robots: { index: false, follow: false },
};

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
            <div className="bg-slate-100 dark:bg-slate-800 p-8 rounded-full mb-6">
                <FileQuestion size={64} className="text-slate-400 dark:text-slate-500" />
            </div>

            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                عذراً، الصفحة غير موجودة
            </h2>

            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
                يبدو أنك وصلت إلى رابط خاطئ أو تم حذف الصفحة التي تبحث عنها.
            </p>

            <Link
                href="/"
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold transition-all"
            >
                <Home size={20} />
                عودة للرئيسية
            </Link>
        </div>
    );
}
