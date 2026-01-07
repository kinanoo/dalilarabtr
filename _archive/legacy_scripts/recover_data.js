const fs = require('fs');
const path = require('path');

const OLD_KEY = 42;
const NEW_KEY = 7;

// Old deobfuscation to recover data
function recover(encoded) {
    if (!encoded) return '';
    try {
        const base64 = encoded.split('').map(char => {
            return String.fromCharCode(char.charCodeAt(0) - OLD_KEY);
        }).join('');
        return Buffer.from(base64, 'base64').toString('utf8');
    } catch (e) {
        return encoded;
    }
}

// New safe obfuscation
function obfuscateSafe(text) {
    if (!text) return '';
    const b1 = Buffer.from(text).toString('base64');
    const shifted = b1.split('').map(c => String.fromCharCode(c.charCodeAt(0) + NEW_KEY)).join('');
    return Buffer.from(shifted).toString('base64');
}

function processFile(filePath) {
    console.log(`Processing: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');

    // Matches all strings in specific fields
    // Note: We search for patterns like details: '...' where the value might be obfuscated
    const FIELDS = ['details', 'fees', 'warning', 'documents', 'steps', 'tips'];

    // This is a more complex regex to find strings that LOOK obfuscated (mostly high-ANSI or non-Arabic/English mix)
    // Actually, we can just look for strings in those fields.

    content = content.replace(/(details|fees|warning):\s*(['"\`])([\s\S]*?)\2/g, (match, field, quote, value) => {
        if (value.startsWith('DEFAULT_') || value.includes('${') || !value) return match;
        // Attempt recovery if it looks like the old broken encoding
        const recovered = recover(value);
        const reObfuscated = obfuscateSafe(recovered);
        return `${field}: ${quote}${reObfuscated}${quote}`;
    });

    // Array fields
    const arrayFields = ['documents', 'steps', 'tips'];
    arrayFields.forEach(field => {
        const regex = new RegExp(`(${field}:\\s*\\[)([\\s\\S]*?)(\\])`, 'g');
        content = content.replace(regex, (match, prefix, values, suffix) => {
            const newValues = values.replace(/(['"\`])([\s\S]*?)\1/g, (m, q, v) => {
                if (v.startsWith('DEFAULT_') || v.includes('${') || !v) return m;
                const recovered = recover(v);
                const reObfuscated = obfuscateSafe(recovered);
                return `${q}${reObfuscated}${q}`;
            });
            return `${prefix}${newValues}${suffix}`;
        });
    });

    fs.writeFileSync(filePath, content);
    console.log(`Finished: ${filePath}`);
}

const files = [
    'c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles.ts',
    'c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles/edevlet.ts'
];

files.forEach(f => {
    if (fs.existsSync(f)) processFile(f);
});
