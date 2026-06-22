import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Catch-all for any unmatched top-level slug. It ALWAYS 404s, so its metadata
// is always noindex — this stops the inherited site-default index,follow from
// emitting an "index" robots tag on a not-found page (which would conflict with
// the noindex from not-found.tsx). Keeps a single clean noindex signal.
export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function SlugPage() {
    notFound();
}
