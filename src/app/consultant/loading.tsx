import { BrainCircuit, Loader2 } from 'lucide-react';

export default function ConsultantLoading() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
            <div className="text-center space-y-6 p-8">
                <div className="flex items-center justify-center space-x-3 space-x-reverse">
                    <BrainCircuit size={40} className="text-emerald-500" />
                    <Loader2 size={40} className="animate-spin text-emerald-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                        جاري تحميل المستشار الذكي
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        يتم تحضير النظام الخبير...
                    </p>
                </div>
            </div>
        </div>
    );
}
