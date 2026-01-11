'use client';

import IntegrityMonitor from '@/components/admin/IntegrityMonitor';
import { ShieldCheck } from 'lucide-react';

export default function IntegrityPage() {
    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-8 text-slate-400 text-sm font-bold uppercase tracking-wider">
                <ShieldCheck size={16} />
                <span>أدوات النظام / فحص النزاهة</span>
            </div>
            <IntegrityMonitor />
        </div>
    );
}
