'use client';

import { Search } from 'lucide-react';

type HeroSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  dir?: 'rtl' | 'ltr' | 'auto';
  lang?: string;
  autoFocus?: boolean;
  inputClassName?: string;
  wrapperClassName?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export default function HeroSearchInput({
  value,
  onChange,
  placeholder,
  dir,
  lang,
  autoFocus,
  inputClassName,
  wrapperClassName,
  onKeyDown,
}: HeroSearchInputProps) {
  return (
    <div className={`relative max-w-3xl mx-auto ${wrapperClassName || ''}`.trim()}>
      <div className="relative transform transition-transform duration-300 focus-within:scale-[1.005]">
        <div className="absolute inset-y-0 start-4 flex items-center pointer-events-none">
          <Search className="text-slate-400" size={18} />
        </div>
        <input
          type="text"
          aria-label="بحث في المحتوى"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir={dir}
          lang={lang}
          autoFocus={autoFocus}
          onKeyDown={onKeyDown}
          className={`w-full py-4 md:py-5 ps-11 md:ps-12 pe-16 rounded-2xl text-sm md:text-base shadow-sm focus:outline-none focus:ring-4 focus:ring-accent-500/50 border-0 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-xs md:placeholder:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-400 ${inputClassName || ''}`.trim()}
        />
        {/* زر المسح أزيل بناءً على طلب المستخدم */}
      </div>
    </div>
  );
}
