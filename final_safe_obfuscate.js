const fs = require('fs');

const NEW_KEY = 7;

function obfuscateSafe(text) {
    if (!text) return '';
    const b1 = Buffer.from(text).toString('base64');
    const shifted = b1.split('').map(c => String.fromCharCode(c.charCodeAt(0) + NEW_KEY)).join('');
    return Buffer.from(shifted).toString('base64');
}

function processFile(filePath) {
    console.log(`Final Obfuscation: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Single string fields
    const fields = ['details', 'fees', 'warning'];
    fields.forEach(field => {
        const regex = new RegExp(`(${field}:\\s*)(['"\`])([\\s\\S]*?)\\2`, 'g');
        content = content.replace(regex, (match, prefix, quote, value) => {
            // Only obfuscate if it contains Arabic and is not a reference
            if (/[\u0600-\u06FF]/.test(value) && !value.startsWith('DEFAULT_') && !value.includes('${')) {
                return `${prefix}${quote}${obfuscateSafe(value)}${quote}`;
            }
            return match;
        });
    });

    // 2. Array fields
    const arrayFields = ['documents', 'steps', 'tips'];
    arrayFields.forEach(field => {
        const regex = new RegExp(`(${field}:\\s*\\[)([\\s\\S]*?)(\\])`, 'g');
        content = content.replace(regex, (match, prefix, values, suffix) => {
            const newValues = values.replace(/(['"\`])([\s\S]*?)\1/g, (m, q, v) => {
                if (/[\u0600-\u06FF]/.test(v) && !v.startsWith('DEFAULT_') && !v.includes('${')) {
                    return `${q}${obfuscateSafe(v)}${q}`;
                }
                return m;
            });
            return `${prefix}${newValues}${suffix}`;
        });
    });

    fs.writeFileSync(filePath, content);
    console.log(`Finished Final Obfuscation: ${filePath}`);
}

const files = [
    'c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles.ts',
    'c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles/edevlet.ts'
];

files.forEach(f => {
    if (fs.existsSync(f)) processFile(f);
});
