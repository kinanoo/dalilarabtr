import React, { useState } from 'react';
import { Globe, Edit, FileText, Smartphone, Monitor } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Field } from '../ui/Field';
import { inputStyles, ltrInputStyles } from '../ui/styles';
import { StaticPageForm } from '@/lib/schemas';

interface StaticPageEditorProps {
    form: Partial<StaticPageForm>;
    setForm: (data: any) => void;
}

export const StaticPageEditor = ({ form, setForm }: StaticPageEditorProps) => {
    const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

    return (
        <div className="flex flex-col items-stretch w-full space-y-8 animate-in fade-in zoom-in-95">
            <div className="w-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm border-r-4 border-r-emerald-500 mb-2 text-right">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <Globe size={28} className="text-emerald-500" />
                    محرر الصفحات الثابتة (Pro)
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">اكتب كود HTML/Tailwind مباشرة واحصل على معاينة حية.</p>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="عنوان الصفحة" icon={Edit}>
                    <input className={`${inputStyles} text-xl font-bold`} value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
                </Field>
                <Field label="الرابط (Slug)" icon={Globe}>
                    <input className={`${ltrInputStyles} text-emerald-600`} value={form.slug || ''} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="example-page" />
                </Field>
            </div>

            <div className="w-full flex items-center justify-between mb-2">
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
                    <button
                        onClick={() => setViewMode('editor')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'editor' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <FileText size={16} /> كود (Editor)
                    </button>
                    <button
                        onClick={() => setViewMode('preview')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Monitor size={16} /> معاينة (Preview)
                    </button>
                </div>
            </div>

            <div className="w-full h-[600px] border-2 border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950 relative">
                {viewMode === 'editor' ? (
                    <Editor
                        height="100%"
                        defaultLanguage="html"
                        theme="vs-dark"
                        value={form.content || ''}
                        onChange={(value) => setForm({ ...form, content: value })}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            wordWrap: 'on',
                            padding: { top: 20 }
                        }}
                    />
                ) : (
                    <div className="w-full h-full overflow-y-auto bg-white dark:bg-slate-900 p-8">
                        <div className="prose dark:prose-invert max-w-none dir-rtl" dangerouslySetInnerHTML={{ __html: form.content || '' }} />
                    </div>
                )}
            </div>
        </div>
    );
};
