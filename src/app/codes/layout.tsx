// NOTE: This layout intentionally declares NO metadata. The route's real
// metadata (title, description, openGraph, keywords, alternates) is produced
// by generateMetadata() in ./page.tsx, which fully overrides anything a
// parent layout would set. The fields that used to live here were dead code
// (silently overridden), so they were removed to avoid confusion. Keep this a
// pass-through wrapper.
export default function CodesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
