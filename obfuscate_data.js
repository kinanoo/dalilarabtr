const fs = require('fs');
const path = require('path');

const SECURITY_KEY = 42;

function obfuscate(text) {
    if (!text || text.match(/^[A-Za-z0-9+/= ]+$/) && text.length > 50) return text; // Skip already obfuscated (rough check)
    const base64 = Buffer.from(text).toString('base64');
    return base64.split('').map(char => {
        return String.fromCharCode(char.charCodeAt(0) + SECURITY_KEY);
    }).join('');
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Obfuscate simple string fields
    const fields = ['details', 'fees', 'warning'];
    fields.forEach(field => {
        const regex = new RegExp(`(${field}:\\s*)(['"\`])([\\s\\S]*?)\\2`, 'g');
        content = content.replace(regex, (match, prefix, quote, value) => {
            if (value.startsWith('DEFAULT_') || value.includes('${')) return match;
            return `${prefix}${quote}${obfuscate(value)}${quote}`;
        });
    });

    // Obfuscate array fields (manual approach for simplicity)
    // steps: ['...', '...']
    const arrayFields = ['documents', 'steps', 'tips'];
    arrayFields.forEach(field => {
        const regex = new RegExp(`(${field}:\\s*\\[)([\\s\\S]*?)(\\])`, 'g');
        content = content.replace(regex, (match, prefix, values, suffix) => {
            const newValues = values.replace(/(['"\`])([\s\S]*?)\1/g, (m, q, v) => {
                if (v.startsWith('DEFAULT_') || v.includes('${') || v.match(/[\u0600-\u06FF]/) === null) return m;
                return `${q}${obfuscate(v)}${q}`;
            });
            return `${prefix}${newValues}${suffix}`;
        });
    });

    fs.writeFileSync(filePath, content);
    console.log(`Processed: ${filePath}`);
}

const files = [
    'c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles.ts',
    'c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles/edevlet.ts'
];

files.forEach(f => {
    if (fs.existsSync(f)) processFile(f);
});
