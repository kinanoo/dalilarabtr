export async function watermarkModelImage(file: File, text = 'موديلس'): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/svg+xml' || file.type === 'image/gif' || file.type === 'image/avif') return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    if (img.width < 180 || img.height < 180) return file;

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await document.fonts.ready.catch(() => {});
    }

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0);

    const shortSide = Math.min(img.width, img.height);
    const fontSize = Math.max(22, Math.round(shortSide * 0.075));
    const positions = [
      { x: img.width * 0.5, y: img.height * 0.5 },
      { x: img.width * 0.24, y: img.height * 0.24 },
      { x: img.width * 0.76, y: img.height * 0.76 },
    ];

    for (const pos of positions) {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(-22 * Math.PI / 180);
      ctx.globalAlpha = 0.18;
      ctx.font = `900 ${fontSize}px "IBM Plex Sans Arabic", Cairo, Tajawal, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.direction = 'rtl';
      ctx.lineWidth = Math.max(2, fontSize * 0.07);
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeText(text, 0, 0);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.9);
    });
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '.models.webp'), { type: 'image/webp' });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
