const fs = require('fs');

function globalFix(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Pattern: "...", "..." ](link) -> "...", "..." (link) ]
    // We search for `]` followed by `(`
    content = content.replace(/\]\((https?:\/\/[^\s\)]+)\)/g, (match, link) => {
        // If it's `](link)`, change it to `link)]` if it's at the end of an array item
        // But wait, the item IS a string.
        // It should be "...link" ]
        return `(${link})]`;
    });

    // Another case: "string" ](link)',
    // This happens if the link was supposed to be part of the string
    content = content.replace(/"\s*\]\((https?:\/\/[^\s\)]+)\)'/g, (match, link) => {
        return `${link}" ],`;
    });

    fs.writeFileSync(filePath, content);
    console.log(`Global fix applied to: ${filePath}`);
}

globalFix('c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles.ts');
globalFix('c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles/edevlet.ts');
