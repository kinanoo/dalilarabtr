'use client';

import { useEffect, useState } from 'react';

const PREFIX = 'دليلك ';
const EMPHASIS = 'الشامل';
const SUFFIX = ' في تركيا';
const FULL_TITLE = `${PREFIX}${EMPHASIS}${SUFFIX}`;

function titleParts(text: string) {
  const prefix = text.slice(0, Math.min(text.length, PREFIX.length));
  const emphasisStart = PREFIX.length;
  const emphasis = text.slice(emphasisStart, emphasisStart + EMPHASIS.length);
  const suffix = text.slice(emphasisStart + EMPHASIS.length);
  return { prefix, emphasis, suffix };
}

export default function AnimatedHeroTitle() {
  const [visibleText, setVisibleText] = useState('');
  const [loopEmphasis, setLoopEmphasis] = useState<string | null>(null);
  const [introComplete, setIntroComplete] = useState(false);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const sleep = (duration: number) => new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        resolve();
      }, duration);
      timers.add(timer);
    });

    const run = async () => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) {
        setVisibleText(FULL_TITLE);
        setIntroComplete(true);
        setIsTyping(false);
        return;
      }

      const characters = Array.from(FULL_TITLE);
      await sleep(160);
      for (let index = 1; index <= characters.length && !cancelled; index += 1) {
        setVisibleText(characters.slice(0, index).join(''));
        await sleep(index === PREFIX.length ? 105 : 58);
      }

      if (cancelled) return;
      setIntroComplete(true);
      setIsTyping(false);
      await sleep(6500);

      const wordCharacters = Array.from(EMPHASIS);
      while (!cancelled) {
        setIsTyping(true);
        for (let index = wordCharacters.length - 1; index >= 0 && !cancelled; index -= 1) {
          setLoopEmphasis(wordCharacters.slice(0, index).join(''));
          await sleep(72);
        }
        await sleep(280);
        for (let index = 1; index <= wordCharacters.length && !cancelled; index += 1) {
          setLoopEmphasis(wordCharacters.slice(0, index).join(''));
          await sleep(92);
        }
        setLoopEmphasis(null);
        setIsTyping(false);
        await sleep(8500);
      }
    };

    const startFrame = requestAnimationFrame(() => void run());
    return () => {
      cancelled = true;
      cancelAnimationFrame(startFrame);
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const parts = introComplete
    ? { prefix: PREFIX, emphasis: loopEmphasis ?? EMPHASIS, suffix: SUFFIX }
    : titleParts(visibleText);

  return (
    <h1
      className="mb-0 h-[calc(1.4em+0.5rem)] pt-2 text-3xl font-black leading-[1.4] text-slate-900 dark:text-white max-[300px]:text-2xl sm:text-4xl md:text-6xl"
      aria-label={FULL_TITLE}
    >
      <span className="sr-only">{FULL_TITLE}</span>
      <span
        className="relative inline-block h-[1.4em] w-[9em] max-w-full overflow-visible align-top"
        aria-hidden="true"
        dir="rtl"
      >
        <span className="absolute inset-0 flex items-baseline justify-start whitespace-nowrap text-right">
          {parts.prefix}
          <span className="relative inline-block align-baseline">
            <span
              className="bg-gradient-to-l from-emerald-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300"
              style={{ fontSize: 'calc(1em + 2px)' }}
            >
              {parts.emphasis}
            </span>
            <span
              className={`absolute -bottom-0.5 inset-x-0 h-[3px] origin-right rounded-full bg-emerald-700 transition-transform duration-500 dark:bg-emerald-400 ${introComplete ? 'scale-x-100' : 'scale-x-0'}`}
              aria-hidden="true"
            />
          </span>
          {parts.suffix}
          <span
            className={`ms-1 inline-block h-[0.9em] w-0.5 translate-y-[0.08em] bg-emerald-700 align-baseline transition-opacity dark:bg-emerald-300 ${isTyping ? 'animate-pulse opacity-100' : 'opacity-0'}`}
            aria-hidden="true"
          />
        </span>
      </span>
    </h1>
  );
}
