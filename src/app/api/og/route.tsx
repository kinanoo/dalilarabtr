import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Bundle fonts at build time — eliminates runtime network fetch on cold starts
const cairoBold = fetch(
  new URL('./fonts/Cairo-Bold.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

const cairoRegular = fetch(
  new URL('./fonts/Cairo-Regular.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

// Satori renders Arabic words LTR — reverse word order + fix bracket/slash positions
function fixArabic(text: string): string {
  return text
    .split(' ')
    .reverse()
    .map((word) => {
      // Reverse slash-separated parts (e.g. "احتساب/عرض" → "عرض/احتساب")
      if (word.includes('/')) {
        word = word.split('/').reverse().join('/');
      }
      // Word fully wrapped in brackets: keep as-is (both sides cancel out)
      if (word.startsWith('(') && word.endsWith(')')) return word;
      if (word.startsWith(')') && word.endsWith('(')) return word;
      // Move bracket from start to end (and swap type)
      if (word.startsWith('(')) return word.slice(1) + ')';
      if (word.startsWith(')')) return word.slice(1) + '(';
      // Move bracket from end to start (and swap type)
      if (word.endsWith(')')) return '(' + word.slice(0, -1);
      if (word.endsWith('(')) return ')' + word.slice(0, -1);
      return word;
    })
    .join(' ');
}

// Split text into lines of roughly maxChars characters, breaking at word boundaries
function splitLines(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current && (current + ' ' + word).length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function truncateTitle(title: string, maxLen = 90): string {
  if (title.length <= maxLen) return title;
  return title.substring(0, maxLen).replace(/\s+\S*$/, '') + '...';
}

function getTitleSize(len: number): { fontSize: number; charsPerLine: number } {
  if (len > 80) return { fontSize: 40, charsPerLine: 38 };
  if (len > 60) return { fontSize: 44, charsPerLine: 34 };
  if (len > 40) return { fontSize: 48, charsPerLine: 30 };
  return { fontSize: 52, charsPerLine: 26 };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const rawTitle = searchParams.get('title') || 'دليل العرب في تركيا';
    const category = searchParams.get('category') || '';

    const title = truncateTitle(rawTitle);
    const { fontSize, charsPerLine } = getTitleSize(title.length);
    const lines = splitLines(title, charsPerLine);

    const [boldFont, regularFont] = await Promise.all([cairoBold, cairoRegular]);

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #065f46 0%, #0d9488 50%, #047857 100%)',
            fontFamily: 'Cairo',
            padding: '60px',
            position: 'relative',
          }}
        >
          {/* Dot pattern overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              display: 'flex',
            }}
          />

          {/* Top: category + title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '20px',
              zIndex: 1,
            }}
          >
            {category && (
              <span
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  padding: '8px 24px',
                  borderRadius: '9999px',
                  fontSize: '22px',
                  fontWeight: 400,
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                {fixArabic(category)}
              </span>
            )}

            {/* Title — each line as separate div, right-aligned via parent */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0px',
                width: '100%',
              }}
            >
              {lines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    color: 'white',
                    fontSize: `${fontSize}px`,
                    fontWeight: 700,
                    lineHeight: 1.5,
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  }}
                >
                  {fixArabic(line)}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '16px',
              padding: '16px 24px',
              zIndex: 1,
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <span
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '20px',
                fontWeight: 400,
              }}
            >
              dalilarabtr.com
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{ color: 'white', fontSize: '24px', fontWeight: 700 }}
              >
                {fixArabic('دليل العرب في تركيا')}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://dalilarabtr.com/logo.png"
                width="48"
                height="48"
                alt=""
                style={{ borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: 'Cairo', data: boldFont, weight: 700 as const, style: 'normal' as const },
          { name: 'Cairo', data: regularFont, weight: 400 as const, style: 'normal' as const },
        ],
        headers: {
          'Cache-Control':
            'public, immutable, no-transform, max-age=31536000, s-maxage=31536000',
        },
      }
    );
  } catch (e) {
    console.error('OG image generation failed:', e);
    return new Response(null, {
      status: 302,
      headers: { Location: '/og-image.jpg' },
    });
  }
}
