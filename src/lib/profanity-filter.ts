/**
 * بسيط جداً: فلتر للكلمات البذيئة (عربي / إنجليزي)
 * Very basic profanity filter for Arabic and English.
 */

const BLACKLIST = [
    // English (Basic)
    "shit", "fuck", "bitch", "ass", "dick", "pussy", "whore", "slut", "bastard",

    // Arabic (Basic Placeholders - عينة بسيطة)
    "شرموطة", "قحبة", "منيوك", "كسمك", "عاهر", "زب", "طيظ", "كس اختك", "ابن الكلب", "حيوان", "غبي",
    "زبالة", "حقير", "سافل"
];

export function containsProfanity(text: string): boolean {
    if (!text) return false;

    // Normalize text: remove special chars, convert to lowercase
    const normalized = text.toLowerCase().replace(/[^\w\u0600-\u06FF\s]/g, '');
    const words = normalized.split(/\s+/);

    return words.some(word => BLACKLIST.includes(word));
}
