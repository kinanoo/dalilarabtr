'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { getAuthClient } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import { watermarkImage } from '@/lib/watermark';
import { compressImage } from '@/lib/imageOptimize';

interface ImageUploaderProps {
    value?: string;
    onChange: (url: string) => void;
    bucket?: string;
    path?: string;
    label?: string;
    className?: string;
    maxWidth?: number;
    quality?: number;
    /** Bake in the diagonal site-attribution watermark. Default true — turn OFF
     *  for decorative assets like the site backdrop where a watermark would show. */
    watermark?: boolean;
}

export const ImageUploader = ({
    value,
    onChange,
    bucket = 'public',
    path = 'uploads',
    label = 'صورة العرض',
    className,
    maxWidth = 800,
    quality = 0.7,
    watermark = true,
}: ImageUploaderProps) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(value || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const sb = getAuthClient();
        if (!sb) {
            toast.error('خطأ: لا يوجد اتصال بقاعدة البيانات');
            return;
        }

        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        const rawFile = e.target.files[0];

        setUploading(true);
        const loadingToast = toast.loading('جاري ضغط ورفع الصورة...');

        try {
            // 1. Compress image
            const compressed = await compressImage(rawFile, maxWidth, quality);

            // 2. Apply diagonal site-attribution watermark in-canvas
            //    BEFORE the bytes leave the browser. This baked-in
            //    watermark travels with the file — survives screenshots,
            //    right-click-save, and the lightbox download button on
            //    article pages. Soft failure: if watermarking throws,
            //    the helper returns the compressed file unchanged so
            //    publishing never blocks on a cosmetic step.
            const file = watermark ? await watermarkImage(compressed) : compressed;

            const fileExt = file.name.split('.').pop();
            const filePath = `${path}/${Math.random().toString(36).substring(2)}.${fileExt}`;

            // 3. Upload — content-addressed filename never changes, so cache it
            // for a year (browser + Cloudflare edge). Cuts repeat egress and
            // speeds up LCP on repeat views (a mobile ranking signal).
            const { error: uploadError } = await sb.storage
                .from(bucket)
                .upload(filePath, file, { contentType: file.type, cacheControl: '31536000' });

            if (uploadError) throw uploadError;

            // 3. Get Public URL
            const { data } = sb.storage.from(bucket).getPublicUrl(filePath);

            setPreview(data.publicUrl);
            onChange(data.publicUrl);
            toast.success('تم رفع الصورة بنجاح');

        } catch (error) {
            logger.error('Upload Error:', error);
            toast.error('فشل الرفع: ' + (error instanceof Error ? error.message : String(error)));
        } finally {
            setUploading(false);
            toast.dismiss(loadingToast);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        onChange('');
    };

    return (
        <div className={`w-full ${className}`}>
            {label && <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2 flex items-center gap-2">
                <ImageIcon size={18} className="text-emerald-500" />
                {label}
            </label>}

            <div
                onClick={() => fileInputRef.current?.click()}
                className={`
                    relative group cursor-pointer 
                    border-2 border-dashed border-slate-300 dark:border-slate-700 
                    rounded-2xl transition-all duration-300
                    hover:border-emerald-500 dark:hover:border-emerald-500/50 
                    hover:bg-slate-50 dark:hover:bg-slate-900/50
                    flex flex-col items-center justify-center
                    overflow-hidden
                    ${preview ? 'h-64' : 'h-32'}
                `}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                />

                {uploading ? (
                    <div className="flex flex-col items-center text-emerald-500 animate-pulse">
                        <Loader2 size={32} className="animate-spin mb-2" />
                        <span className="text-sm font-bold">جاري الرفع...</span>
                    </div>
                ) : preview ? (
                    <>
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">تغيير الصورة</span>
                            <button
                                onClick={handleRemove}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                title="حذف الصورة"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-slate-400 group-hover:text-emerald-600 transition-colors">
                        <Upload size={32} className="mb-2" />
                        <span className="font-bold text-sm">اضغط لرفع صورة</span>
                        <span className="text-xs opacity-70 mt-1">PNG, JPG, WEBP (Max 5MB)</span>
                    </div>
                )}
            </div>
        </div>
    );
};
