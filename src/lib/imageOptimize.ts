/**
 * imageOptimize.ts — client-side image downscale + WebP conversion, run in the
 * browser BEFORE the bytes are uploaded to Supabase Storage.
 *
 * Why this is the load-bearing image-weight lever on this stack:
 *   next.config.ts sets `images.unoptimized = true` because the site runs on
 *   Cloudflare Workers (OpenNext), which has no server-side image optimizer
 *   (no sharp). So Next never resizes/re-encodes — the file we store is exactly
 *   what every device downloads, on every viewport. Compressing here is the
 *   only thing standing between a 3–8 MB phone-camera JPEG and the low-end
 *   Android / limited-data audience. WebP at q≈0.7 typically turns a multi-MB
 *   JPEG/PNG into ~100–250 KB.
 *
 * Shared by ImageUploader (admin/dashboard) and ServiceForm so every upload
 * path goes through the same pipeline (compress → watermark → upload).
 */
export async function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<File> {
    // Skip non-images and SVG (vector — already tiny; rasterising would bloat it).
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            // Scale down only when wider than maxWidth — never upscale.
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
                    } else {
                        // Canvas export failed — fall back to the original file
                        // rather than blocking the upload.
                        resolve(file);
                    }
                },
                'image/webp',
                quality,
            );
        };
        img.onerror = () => resolve(file);
        img.src = URL.createObjectURL(file);
    });
}
