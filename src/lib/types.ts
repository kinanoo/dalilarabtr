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
}
