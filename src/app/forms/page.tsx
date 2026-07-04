import FormsClient from './FormsClient';
import { FORMS } from '@/lib/constants';
import type { AdminForm } from '@/lib/types';

/**
 * /forms — downloadable official form library.
 *
 * The form list is server-rendered here (from the static FORMS catalogue) and
 * handed to FormsClient as initial props, so crawlers and first paint see the
 * full list instead of a spinner. FormsClient keeps the admin refresh hook for
 * live updates and owns the comments widget.
 */

export const revalidate = 600;

const initialForms: AdminForm[] = FORMS.map((f) => ({
  id: f.id,
  name: f.name,
  desc: f.desc,
  type: f.type,
  url: f.url,
  active: true,
}));

export default function FormsPage() {
  return <FormsClient initialForms={initialForms} />;
}
