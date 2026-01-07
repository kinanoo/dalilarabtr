import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="text-center space-y-4">
                <Loader2 size={48} className="animate-spin text-primary-600 mx-auto" />
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                    جاري التحميل...
                </p>
            </div>
        </div>
    );
}
