import { z } from 'zod';

// Helper for optional strings that should be null if empty
const optionalString = z.string().trim().optional().transform(v => v === '' ? null : v);
// Helper for required strings
const requiredString = z.string().trim().min(1, { message: "هذا الحقل مطلوب" });

// --- Article Schema ---
export const articleSchema = z.object({
    title: requiredString.min(3, { message: "العنوان يجب أن يكون 3 أحرف على الأقل" }),
    category: requiredString,
    intro: optionalString,
    details: requiredString.min(20, { message: "التفاصيل يجب أن تكون 20 حرفاً على الأقل" }),
    fees: optionalString,
    source: z.string().trim().url({ message: "رابط غير صالح" }).optional().or(z.literal('')),
    warning: optionalString,
    lastUpdate: optionalString, // Date string
    steps: z.array(z.string()).optional(),
    documents: z.array(z.string()).optional(),
    tips: z.array(z.string()).optional(),
    image: optionalString,
    published_at: optionalString, // Date string (ISO)
    // active: z.boolean().optional().default(true), // REMOVED: Table has no active column
});

// --- Service Schema ---
export const serviceSchema = z.object({
    name: requiredString.min(2, { message: "الاسم مطلوب" }),
    whatsapp: requiredString.regex(/^(\+?90|0)?5\d{9}$/, { message: "رقم الواتساب غير صحيح (يجب أن يكون رقم تركي)" }),
    city: requiredString, // Replaces location
    bio: z.string().trim().max(150, { message: "النبذة يجب ألا تتجاوز 150 حرفاً" }).optional().transform(v => v === '' ? null : v),
    description: requiredString.min(20, { message: "الوصف يجب أن يكون 20 حرفاً على الأقل" }),
    category: z.string().optional(),
    profession: z.string().trim().min(1, { message: "التخصص مطلوب" }),
    image: optionalString,
    phone: requiredString.regex(/^(\+?90|0)?5\d{9}$/, { message: "رقم الواتساب غير صحيح (يجب أن يكون رقم تركي)" }),
    active: z.boolean().optional().default(true),
});

// --- Newsletter Schema ---
export const newsletterSchema = z.object({
    email: z.string().email({ message: "البريد الإلكتروني غير صحيح" }),
});

// --- Request Service Schema ---
export const requestServiceSchema = z.object({
    name: z.string().trim().optional(),
    serviceId: requiredString,
    details: z.string().trim().optional(),
});

// --- Static Page Schema ---
export const staticPageSchema = z.object({
    title: requiredString.min(3, { message: "عنوان الصفحة مطلوب" }),
    slug: requiredString.regex(/^[a-z0-9-]+$/, { message: "الرابط يجب أن يحتوي فقط على أحرف إنجليزية صغيرة وأرقام وشرطات" }),
    content: requiredString.min(10, { message: "المحتوى قصير جداً" }),
});

// --- Contact Schema ---
export const contactSchema = z.object({
    name: z.string().trim().optional(),
    messageType: requiredString,
    message: requiredString.min(10, { message: "الرسالة يجب أن تكون 10 أحرف على الأقل" }),
});

// --- General/Shared Types ---
export type ArticleForm = z.infer<typeof articleSchema>;
export type ServiceForm = z.infer<typeof serviceSchema>;
export type RequestServiceInputs = z.infer<typeof requestServiceSchema>;
export type StaticPageForm = z.infer<typeof staticPageSchema>;
export type NewsletterInputs = z.infer<typeof newsletterSchema>;
export type ContactInputs = z.infer<typeof contactSchema>;
