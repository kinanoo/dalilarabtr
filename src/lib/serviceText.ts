export function cleanServiceText(value: string | null | undefined) {
  if (!value) return '';

  return value
    .replace(/\s*باللغة العربية\s*/g, ' ')
    .replace(/\s*ويتيح التواصل باللغة العربية\.?/g, '.')
    .replace(/\s*للتواصل باللغة العربية\s*/g, ' للتواصل ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\./g, '.')
    .trim();
}

export function displayServiceProfession(value: string | null | undefined, fallback = '') {
  return cleanServiceText(value) || fallback;
}

