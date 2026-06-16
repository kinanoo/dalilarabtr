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
 *   with the bytes. Screenshots? Watermarked. Save-as? Watermarked.
 *   Google indexed copy? Watermarked.
 *
 * v2 rewrite (2026-06-16) — fixes a real complaint:
 *
 *   The previous version tiled THIN white text + soft black drop
 *   shadow across the entire image with ~280 px spacing and 18 %
 *   opacity. On the Gaziantep article hero image the result looked
 *   like scratches and smudges — the user said the watermark
 *   was "مشوهة جدا وغير واضحة". Two compounding causes:
 *
 *     1. Drop shadow (shadowBlur) on small Arabic text smeared the
 *        letters into illegible blobs at low opacity.
 *     2. Dense tiling at 45° = overlapping letterforms = visual
 *        noise rather than legible attribution.
 *
 *   This version flips both choices:
 *
 *     - Sparse stamps: 1–4 large diagonal stamps depending on the
 *       image dimensions. Not dozens of small ones.
 *     - Each STAMP is a single visual unit composed of the SITE
 *       LOGO + the site name beside it, drawn together at the same
 *       rotation. The stamp reads as "this is from <brand>", not as
 *       random text floating on top.
 *     - Stroke + fill instead of drop shadow. Black 2px stroke under
 *       white fill gives crisp readable letters at 28 % alpha over
 *       any background colour (light document scan, dark photo,
 *       anything).
 *     - Each stamp is drawn ONCE at higher opacity (~0.28). No
 *       overlap, no smear.
 *
 *   Cropping protection is preserved by placing stamps at the centre
 *   AND in one or more corners depending on image size — a reader
 *   who crops away the centre still finds a corner stamp, and vice
 *   versa.
 */

const WATERMARK_TEXT = 'دليل العرب والسوريين في تركيا';
const LOGO_URL = '/logo.png';

interface Options {
    /** Minimum dimension (px) below which we skip — these are too
        small to read the watermark anyway. Default 200. */
    minSize?: number;
    /** 0–1. Opacity of the watermark stamp. Default 0.28. */
    opacity?: number;
    /** Font size as a fraction of the short side. Default 0.055
        (5.5 % of short side, e.g. 55 px on a 1000 px short side). */
    fontSizeRatio?: number;
}

/**
 * Watermark `file` and return a new File. Returns the original File
 * unchanged when watermarking should be skipped (SVG, tiny, GIF, etc.).
 *
 * Failure mode: if anything throws (Canvas blocked, image decode
 * fails, logo fails to load, blob conversion fails) we return the
 * ORIGINAL file. The upload still succeeds; we simply have an
 * unwatermarked image. Watermarking is a nice-to-have on top of
 * upload — never block a content upload over a cosmetic step.
 */
export async function watermarkImage(
    file: File,
    options: Options = {},
): Promise<File> {
    const {
        minSize = 200,
        opacity = 0.28,
        fontSizeRatio = 0.055,
    } = options;

    if (!file.type.startsWith('image/')) return file;
    if (file.type === 'image/svg+xml') return file;
    if (file.type === 'image/gif') return file;
    if (file.type === 'image/avif') return file;

    try {
        const dataUrl = await fileToDataURL(file);
        const img = await loadImage(dataUrl);

        if (img.width < minSize || img.height < minSize) return file;

        // Logo is loaded once and cached; if it fails to load we fall
        // through to text-only stamps.
        const logo = await loadLogoOnce().catch(() => null);

        // Wait for the page's web fonts so the canvas can render
        // Cairo/Tajawal instead of falling back to Times/system serif.
        if (typeof document !== 'undefined' && document.fonts?.ready) {
            await document.fonts.ready.catch(() => {/* fine */});
        }

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return file;

        ctx.drawImage(img, 0, 0);

        const shortSide = Math.min(img.width, img.height);
        const fontSize = Math.max(18, Math.round(shortSide * fontSizeRatio));
        const logoSize = Math.round(fontSize * 1.8);  // logo a touch larger than text caps
        const gap = Math.round(fontSize * 0.4);
        const padding = Math.round(fontSize * 0.5);

        // Pre-measure the stamp UNIT (logo + gap + text) so we can
        // size the canvas-stroke and centre it cleanly per stamp.
        ctx.font = `bold ${fontSize}px Cairo, Tajawal, "Segoe UI", Tahoma, sans-serif`;
        const textMetrics = ctx.measureText(WATERMARK_TEXT);
        const textWidth = textMetrics.width;
        const stampWidth = (logo ? logoSize + gap : 0) + textWidth;
        const stampHeight = Math.max(logoSize, fontSize) + padding * 2;

        // Stamp positions — sparse, not tiled. The image's diagonal
        // is divided into ~stampSpacing-long segments; placing 1 - 4
        // stamps along that line guarantees centre coverage plus
        // some corner protection without overlap.
        const positions: Array<{ x: number; y: number }> = [];
        positions.push({ x: img.width / 2, y: img.height / 2 });
        if (shortSide >= 500) {
            // Add two more stamps offset toward opposite corners. NW + SE
            // axis chosen because the rotation we apply (-20°) makes
            // those corners visually furthest from the centre.
            positions.push({ x: img.width * 0.22, y: img.height * 0.22 });
            positions.push({ x: img.width * 0.78, y: img.height * 0.78 });
        }
        if (shortSide >= 1200) {
            // Big hero images get a fourth stamp on the opposite
            // diagonal — guarantees coverage if cropped in HALF
            // along either axis.
            positions.push({ x: img.width * 0.22, y: img.height * 0.78 });
        }

        // Draw each stamp as a single unit at the same rotation.
        for (const pos of positions) {
            drawStamp({
                ctx,
                cx: pos.x,
                cy: pos.y,
                rotation: -20 * Math.PI / 180,
                logo,
                logoSize,
                fontSize,
                gap,
                stampWidth,
                stampHeight,
                opacity,
            });
        }

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
        return file;
    }
}

// ─── stamp renderer ────────────────────────────────────────────────

interface StampArgs {
    ctx: CanvasRenderingContext2D;
    cx: number;
    cy: number;
    rotation: number;
    logo: HTMLImageElement | null;
    logoSize: number;
    fontSize: number;
    gap: number;
    stampWidth: number;
    stampHeight: number;
    opacity: number;
}

function drawStamp({
    ctx, cx, cy, rotation, logo, logoSize, fontSize, gap, stampWidth, opacity,
}: StampArgs) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.globalAlpha = opacity;

    // Optional subtle dark rounded plaque behind the stamp for
    // legibility on busy backgrounds. Very transparent so the image
    // still shows through cleanly.
    // const plaqueW = stampWidth + fontSize;
    // const plaqueH = Math.max(logoSize, fontSize) + fontSize * 0.6;
    // ctx.fillStyle = 'rgba(0,0,0,0.18)';
    // roundRect(ctx, -plaqueW / 2, -plaqueH / 2, plaqueW, plaqueH, fontSize * 0.4);
    // ctx.fill();

    // Compose horizontally with the logo at the RIGHT edge (RTL
    // reading direction: logo precedes the text). x coordinates use
    // the LEFT edge of the stamp because canvas rotation centres at
    // (0,0); we shift -stampWidth/2 so the unit is centred.
    const startX = -stampWidth / 2;
    let cursorX = startX;

    if (logo) {
        const yLogo = -logoSize / 2;
        // Draw logo with the same opacity (already set via globalAlpha)
        ctx.drawImage(logo, cursorX, yLogo, logoSize, logoSize);
        cursorX += logoSize + gap;
    }

    // Text — stroke under fill for legibility on any background. The
    // stroke is a thin dark outline; the fill is white. Together they
    // read clearly over both light document scans and dark photos
    // without depending on drop shadow.
    ctx.font = `bold ${fontSize}px Cairo, Tajawal, "Segoe UI", Tahoma, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    ctx.lineWidth = Math.max(2, fontSize * 0.06);
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.fillStyle = 'rgba(255,255,255,0.98)';
    // RTL text positions to the LEFT of the start point with
    // textAlign='left' actually starts at cursorX. To draw at the
    // correct horizontal range with the inline logo above, we keep
    // textAlign='left' and place the text right after the logo.
    ctx.strokeText(WATERMARK_TEXT, cursorX, 0);
    ctx.fillText(WATERMARK_TEXT, cursorX, 0);

    ctx.restore();
}

// ─── helpers ───────────────────────────────────────────────────────

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

// Logo lives at a fixed same-origin URL and never changes per upload;
// cache the loaded bitmap so repeated uploads in a session don't
// re-fetch it.
let _logoPromise: Promise<HTMLImageElement> | null = null;
function loadLogoOnce(): Promise<HTMLImageElement> {
    if (!_logoPromise) _logoPromise = loadImage(LOGO_URL);
    return _logoPromise;
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
