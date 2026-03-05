'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback } from 'react';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Heading1, Heading2, Heading3,
    List, ListOrdered,
    AlignRight, AlignCenter, AlignLeft,
    Link as LinkIcon, Image as ImageIcon,
    Undo, Redo, Minus, Quote, Palette, RemoveFormatting,
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: string;
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder = 'ابدأ الكتابة هنا...',
    minHeight = '300px',
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Underline,
            TextStyle,
            Color,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-emerald-600 underline', target: '_blank', rel: 'noopener noreferrer' },
            }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Image.configure({ inline: false, allowBase64: false }),
            Placeholder.configure({ placeholder }),
        ],
        content: value || '',
        editorProps: {
            attributes: {
                class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none',
                dir: 'rtl',
                style: `min-height: ${minHeight}; padding: 1rem;`,
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Sync external value changes (e.g. loading data from DB)
    useEffect(() => {
        if (!editor) return;
        const currentHTML = editor.getHTML();
        // Only update if the value actually changed from outside
        if (value !== currentHTML && value !== undefined) {
            editor.commands.setContent(value || '', { emitUpdate: false });
        }
    }, [value, editor]);

    const addLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href || '';
        const url = window.prompt('أدخل الرابط:', previousUrl);
        if (url === null) return; // cancelled
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    }, [editor]);

    const addImage = useCallback(() => {
        if (!editor) return;
        const url = window.prompt('أدخل رابط الصورة:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    const setColor = useCallback(() => {
        if (!editor) return;
        const color = window.prompt('أدخل اللون (مثال: #e74c3c أو red):', '#e74c3c');
        if (color) {
            editor.chain().focus().setColor(color).run();
        }
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 focus-within:border-emerald-500 transition-colors">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                {/* Undo / Redo */}
                <ToolBtn
                    icon={<Undo size={16} />}
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="تراجع"
                />
                <ToolBtn
                    icon={<Redo size={16} />}
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="إعادة"
                />
                <Separator />

                {/* Headings */}
                <ToolBtn
                    icon={<Heading1 size={16} />}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    active={editor.isActive('heading', { level: 1 })}
                    title="عنوان رئيسي"
                />
                <ToolBtn
                    icon={<Heading2 size={16} />}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive('heading', { level: 2 })}
                    title="عنوان فرعي"
                />
                <ToolBtn
                    icon={<Heading3 size={16} />}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={editor.isActive('heading', { level: 3 })}
                    title="عنوان صغير"
                />
                <Separator />

                {/* Text formatting */}
                <ToolBtn
                    icon={<Bold size={16} />}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    title="عريض"
                />
                <ToolBtn
                    icon={<Italic size={16} />}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    title="مائل"
                />
                <ToolBtn
                    icon={<UnderlineIcon size={16} />}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive('underline')}
                    title="تحته خط"
                />
                <ToolBtn
                    icon={<Strikethrough size={16} />}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    active={editor.isActive('strike')}
                    title="يتوسطه خط"
                />
                <Separator />

                {/* Lists */}
                <ToolBtn
                    icon={<List size={16} />}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    title="قائمة نقطية"
                />
                <ToolBtn
                    icon={<ListOrdered size={16} />}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    title="قائمة مرقمة"
                />
                <Separator />

                {/* Alignment */}
                <ToolBtn
                    icon={<AlignRight size={16} />}
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    active={editor.isActive({ textAlign: 'right' })}
                    title="محاذاة يمين"
                />
                <ToolBtn
                    icon={<AlignCenter size={16} />}
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    active={editor.isActive({ textAlign: 'center' })}
                    title="محاذاة وسط"
                />
                <ToolBtn
                    icon={<AlignLeft size={16} />}
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    active={editor.isActive({ textAlign: 'left' })}
                    title="محاذاة يسار"
                />
                <Separator />

                {/* Extras */}
                <ToolBtn
                    icon={<Quote size={16} />}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    active={editor.isActive('blockquote')}
                    title="اقتباس"
                />
                <ToolBtn
                    icon={<Minus size={16} />}
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="خط فاصل"
                />
                <ToolBtn
                    icon={<LinkIcon size={16} />}
                    onClick={addLink}
                    active={editor.isActive('link')}
                    title="رابط"
                />
                <ToolBtn
                    icon={<ImageIcon size={16} />}
                    onClick={addImage}
                    title="صورة"
                />
                <ToolBtn
                    icon={<Palette size={16} />}
                    onClick={setColor}
                    title="لون النص"
                />
                <ToolBtn
                    icon={<RemoveFormatting size={16} />}
                    onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                    title="إزالة التنسيق"
                />
            </div>

            {/* Editor Area */}
            <EditorContent editor={editor} />
        </div>
    );
}

// ── Toolbar Button ──
function ToolBtn({ icon, onClick, active, disabled, title }: {
    icon: React.ReactNode;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-2 rounded-lg transition-colors ${
                active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : disabled
                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
        >
            {icon}
        </button>
    );
}

// ── Separator ──
function Separator() {
    return <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />;
}
