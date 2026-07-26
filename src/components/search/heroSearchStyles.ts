/**
 * The hero search field's look, defined once.
 *
 * Two components paint this field: LazyGlobalSearch draws it before the
 * search logic has downloaded, and GlobalSearch draws it afterwards. They
 * used to carry their own copies of these classes, and the copies drifted —
 * the placeholder rendered 68px tall against the real field's 60px, so
 * clicking the search box made the page jump. Sharing the strings means the
 * swap is, by construction, invisible.
 */

/** The wrapper that positions the field and its dropdown. */
export const HERO_WRAPPER = 'relative mx-auto max-w-xl';

/** The form. `group` drives the glow's hover state. */
export const HERO_FORM = 'relative transform transition-all duration-300 group';

/** The blurred emerald/cyan halo behind the field. */
export const HERO_GLOW =
  'absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500';

/** The magnifier, pinned to the start edge (right, in RTL). */
export const HERO_ICON_WRAP = 'absolute inset-y-0 start-4 flex items-center pointer-events-none z-10';

/**
 * The field itself.
 *
 * `appearance-none` is load-bearing: WebKit renders `input[type="search"]`
 * with `appearance: textfield`, which on iOS ignores border-radius and
 * squares the pill off. Every other browser is unaffected by the reset.
 */
export const HERO_FIELD =
  'w-full transition-all outline-none border-0 appearance-none py-4 ps-12 pe-24 rounded-full ' +
  'bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl text-slate-800 dark:text-white ' +
  'placeholder:text-slate-500 dark:placeholder:text-slate-500 text-lg shadow-2xl ' +
  'ring-1 ring-slate-200 dark:ring-white/10 focus:ring-2 focus:ring-emerald-500/60 ' +
  'focus:shadow-[0_0_20px_4px_rgba(16,185,129,0.15)] relative z-10';

/** The green «بحث» pill that sits inside the field at the end edge (left, in RTL). */
export const HERO_SUBMIT =
  'absolute inset-y-1.5 end-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-6 rounded-full ' +
  'font-bold shadow-lg transform active:scale-95 transition-all z-20 flex items-center justify-center';

export const HERO_PLACEHOLDER = 'ماذا تريد أن تعرف اليوم؟ (إقامة، قانون...)';

export const HERO_ARIA_LABEL = 'بحث عام في الموقع';
