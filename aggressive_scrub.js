const fs = require('fs');

function scrubFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove \u followed by spaces (specifically the broken ones)
    content = content.replace(/\\u\s+/g, '');

    // 2. Remove all characters that are NOT:
    // - ASCII (0-127)
    // - Arabic (0600-06FF)
    // - Modern Arabic punctuation/extensions (0600-06FF is the main block)
    // - Common Emoji/Symbols (we can keep some but safer to just stick to core)

    let result = '';
    for (let char of content) {
        const code = char.charCodeAt(0);
        if (code <= 127 || (code >= 0x0600 && code <= 0x06FF)) {
            result += char;
        } else {
            // Drop it (it's garbage from our previous failed obfuscation)
        }
    }

    fs.writeFileSync(filePath, result);
    console.log(`Scrubbed: ${filePath}`);
}

scrubFile('c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles.ts');
scrubFile('c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles/edevlet.ts');
