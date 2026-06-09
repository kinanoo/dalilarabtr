/**
 * watermark.ts — bake a permanent site-attribution overlay into every
 * uploaded image, in the browser, before it ever reaches Supabase
 * Storage.
 *
 * Why baked-in instead of a CSS overlay:
 *
 *   A CSS overlay sits on top of the <img> tag in the live DOM only.
 *   The moment the image leaves the live DOM — a screenshot, a
 *   right-click "save image as", an inspector "save image", a
 *   downloaded copy from our own /article lightbox download button,
 *   even Google Image Search showing the result — the watermark is
 *   gone. The site's content can be lifted with one click.
 *
 *   Baking the watermark into the PNG/WEBP file means it travels
 *   with the image. Screenshots? Watermarked. Save-as? Watermarked.
 *   Google indexed copy? Watermarked. Cropped in half? STILL
 *   watermarked because we tile the text diagonally across the
 *   entire image, so any reasonable crop preserves it.
 *
 * What gets watermarked:
 *
 *   - All raster images uploaded through ImageUploader (articles,
 *     updates, service tiles, anything that uses the shared widget)
 *   - The first hero image on every published article
 *   - Service-provider photos uploaded via ServiceForm
 *
 * What does NOT get watermarked:
 *
 *   - SVG (logos, icons — vectorizing a tiled raster watermark would
 *     ruin them anyway)
 *   - Images smaller than 200 × 200 (icons, favicons, avatars; the
 *     watermark would dominate the picture)
 *   - GIF, AVIF — we keep them as-is (Canvas can't preserve GIF
 *     animation, and we don't want to upgrade their format silently)
 *
 * Tiling strategy:
 *
 *   The site name renders at 45° rotation, tiled across the image
 *   in a regular grid with ~280px spacing. White fill + black soft
 *   shadow gives readability over both light and dark backgrounds.
 *   Opacity 0.18 keeps it as legible attribution, not visual noise.
 *
 *   Why 45°: cropping out the watermark requires removing diagonal
 *   bands, which always sacrifices a significant portion of the
 *   real content. Horizontal-only watermarks fail this test — a
 *   reader can clip the bottom strip and have a clean image.
 */

const WATERMARK_TEXT = 'دليل العرب والسوريين في تركيا';

interface Options {
    /** Minimum dimension (px) below which we skip — these are too small
        to read the watermark anyway. Default 200. */
    minSize?: number;
    /** 0–1. Opacity of the watermark text. Default 0.18. */
    opacity?: number;
    /** Approximate spacing (px) between watermark tiles on the diagonal.
        Smaller = denser. Default 280. */
    tileSpacing?: number;
    /** Font size in px relative to the smaller image dimension; the
        actual rendered size scales so small images get small text and
        big images get big text. Default 0.045 (4.5% of short side). */
    fontSizeRatio?: number;
}

/**
 * Watermark `file` and return a new File. Returns the original File
 * unchanged when watermarking should be skipped (SVG, tiny, etc.).
 *
 * Failure mode: if anything throws (Canvas blocked, image decode
 * fails, blob conversion fails) we return the ORIGINAL file. The
 * upload still succeeds; we simply have an unwatermarked image. We
 * never block a content upload over a cosmetic enhancement.
 */
export async function watermarkImage(
    file: File,
    options: Options = {},
): Promise<File> {
    const {
        minSize = 200,
        opacity = 0.18,
        tileSpacing = 280,
        fontSizeRatio = 0.045,
    } = options;

    // Bail-out conditions — return the file unchanged.
    if (!file.type.startsWith('image/')) return file;
    if (file.type === 'image/svg+xml') return file;
    if (file.type === 'image/gif') return file; // preserve animation
    if (file.type === 'image/avif') return file; // canvas decode is spotty

    try {
        const dataUrl = await fileToDataURL(file);
        const img = await loadImage(dataUrl);

        if (img.width < minSize || img.height < minSize) return file;

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return file;

        // 1. Draw the original image
        ctx.drawImage(img, 0, 0);

        // 2. Compute watermark text dimensions
        const shortSide = Math.min(img.width, img.height);
        const fontSize = Math.max(14, Math.round(shortSide * fontSizeRatio));
        ctx.font = `bold ${fontSize}px Cairo, Tajawal, "Segoe UI", Tahoma, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.direction = 'rtl';

        // 3. White text with soft dark shadow for readability over any
        //    background — works equally well on light document scans
        //    and dark photos.
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.shadowColor = `rgba(0, 0, 0, ${Math.min(opacity * 1.5, 0.4)})`;
        ctx.shadowBlur = Math.max(2, fontSize * 0.08);
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // 4. Tile watermark on a 45° rotated grid. Spacing scales with
        //    image dimension so a 4000px hero photo gets several tiles
        //    while a 400px thumbnail gets just one or two.
        const spacing = Math.max(
            fontSize * 6,
            Math.min(tileSpacing, shortSide * 0.55),
        );

        ctx.save();
        // Translate to center, rotate -30° (visually pleasing on RTL —
        // text slants UP toward the reading direction).
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6); // -30°

        // Compute tile grid — make it slightly larger than the image
        // so rotation doesn't leave bare corners.
        const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
        const tilesX = Math.ceil(diagonal / spacing) + 1;
        const tilesY = Math.ceil(diagonal / spacing) + 1;
        const startX = -tilesX * spacing / 2;
        const startY = -tilesY * spacing / 2;

        for (let y = 0; y <= tilesY; y++) {
            for (let x = 0; x <= tilesX; x++) {
                const px = startX + x * spacing;
                const py = startY + y * spacing;
                ctx.fillText(WATERMARK_TEXT, px, py);
            }
        }
        ctx.restore();

        // 5. Convert canvas → blob → File. Match the original MIME
        //    type when possible; fall back to webp for everything else
        //    (better compression for photo-like content).
        const outType =
            file.type === 'image/png' || file.type === 'image/webp'
                ? file.type
                : 'image/webp';
        const outQuality = file.type === 'image/png' ? undefined : 0.92;

        const blob = await canvasToBlob(canvas, outType, outQuality);
        if (!blob) return file;

        const ext = outType.split('/')[1];
        const newName = file.name.replace(/\.[^.]+$/, `.wm.${ext}`);
        return new File([blob], newName, { type: outType });
    } catch {
        // Any failure → return the original file. Watermarking is a
        // nice-to-have on top of upload; failing it must not block
        // content publishing.
        return file;
    }
}

// ─── helpers ────────────────────────────────────────────────────────

function fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality?: number,
): Promise<Blob | null> {
    return new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), type, quality);
    });
}
