import { LoaderCircle } from 'lucide-react';

type PageRecoveryProps = {
    minHeightClass?: string;
};

export default function PageRecovery({ minHeightClass = 'min-h-[60vh]' }: PageRecoveryProps) {
    return (
        <div
            className={`flex ${minHeightClass} flex-col items-center justify-center px-4 text-center`}
            role="status"
            aria-live="polite"
        >
            <LoaderCircle size={42} className="mb-4 animate-spin text-emerald-600" aria-hidden="true" />
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">جاري استعادة الصفحة...</h2>
        </div>
    );
}
