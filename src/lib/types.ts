export interface Article {
    title: string;
    category: string;
    lastUpdate: string;
    intro: string;
    details: string;
    fees?: string;
    warning?: string;
    source?: string;
    documents?: string[];
    steps?: string[];
    tips?: string[];
    seoKeywords?: string[];
    seoTitle?: string;
    seoDescription?: string;
    seoImage?: string;
    image?: string;
}

export type ArticleData = Article;

export interface AdminArticle extends Article {
    id: string;
    slug?: string;
    active?: boolean;
    created_at?: string;
}

export interface AdminService {
    id: string;
    title: string;
    desc: string;
    description?: string;
    price?: string | null;
    whatsapp?: string | null;
    active: boolean;
    image?: string;
    profession?: string;
    city?: string;
}

export interface AdminUpdate {
    id: string;
    type: 'news' | 'alert' | 'update';
    title: string;
    date: string;
    content?: string | null;
    active: boolean;
    image?: string;
    created_at?: string;
}

export interface AdminCode {
    id: string;
    code: string;
    title: string;
    desc: string;
    category: string;
    severity: 'info' | 'warning' | 'urgent' | 'critical';
    active: boolean;
}

export interface AdminFAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    active: boolean;
}

export interface AdminSource {
    id: string;
    name: string;
    url: string;
    desc: string;
    active: boolean;
    is_official?: boolean;
}

export interface AdminForm {
    id: string;
    name: string;
    desc: string;
    type: string;
    url: string;
    active: boolean;
}

export interface AdminMenu {
    id: string;
    label: string;
    href: string;
    location: string;
    sortOrder: number;
    active: boolean;
}

export interface AdminCategory {
    slug: string;
    title: string;
    description: string;
    active: boolean;
}

export interface AdminTool {
    id: string;
    key: string;
    name: string;
    route: string;
    active: boolean;
}

export interface PlanResult {
    id: string; // The key (e.g. 'syrian-lost-id')
    title: string;
    risk: 'safe' | 'medium' | 'high' | 'critical';
    desc: string;
    description?: string;
    steps: string[];
    docs: string[];
    cost: string;
    legal: string;
    tip: string;
    lastUpdate?: string;
    sources?: Array<{ label: string; url: string }>;
    articleId?: string;
    kbQuery?: string;
    link?: string;
}
