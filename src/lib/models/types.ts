export type ModelCollection = {
  id: string;
  title: string;
  description: string | null;
  watermark_text: string;
  access_pin_hash: string | null;
  pin_hint: string | null;
  default_link_minutes: number;
  show_in_gallery: boolean;
  gallery_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ModelAsset = {
  id: string;
  collection_id: string;
  title: string | null;
  caption: string | null;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  access_pin_hash: string | null;
  pin_hint: string | null;
  show_in_gallery: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ModelShareLink = {
  id: string;
  collection_id: string;
  token: string | null;
  link_kind: 'temporary' | 'main';
  label: string | null;
  expires_at: string;
  revoked_at: string | null;
  max_views: number | null;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
};

export type ModelLinkView = {
  id: string;
  link_id: string;
  viewed_at: string;
  ip_hash: string | null;
  user_agent: string | null;
  referrer: string | null;
};
