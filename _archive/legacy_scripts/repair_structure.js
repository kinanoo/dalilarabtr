const fs = require('fs');

function repairStructure(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // We'll process the file line by line to handle the multi-line array issue
    const lines = content.split('\n');
    let output = [];
    let inArray = false;
    let arrayKey = null;
    let currentArrayItems = [];

    const ARRAY_KEYS = ['documents', 'steps', 'tips', 'seoKeywords'];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmed = line.trim();

        // Check if we start an array
        let startMatch = null;
        for (let key of ARRAY_KEYS) {
            if (trimmed.startsWith(key + ':')) {
                startMatch = key;
                break;
            }
        }

        if (startMatch) {
            // If we were already in an array, close it (sanity check)
            if (inArray) {
                output.push(`    ${arrayKey}: [${currentArrayItems.join(', ')}],`);
            }

            inArray = true;
            arrayKey = startMatch;
            currentArrayItems = [];

            // Extract items from initial line
            let contentMatch = line.match(/\[([\s\S]*)\]?/);
            if (contentMatch) {
                let parts = contentMatch[1].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // split by comma not in quotes
                parts.forEach(p => {
                    let t = p.trim();
                    if (t.startsWith('"') || t.startsWith("'") || t.startsWith("`")) {
                        currentArrayItems.push(t.replace(/^[`']|[`']$/g, '"'));
                    }
                });
            }

            // If the line also closed the array, wait... 
            // The problem is we don't know if it's the TRUE closing bracket.
            // We'll keep collecting until we hit the NEXT property key or a lone closing brace.
        } else if (inArray) {
            // Check if this line is a property of the same object
            if (trimmed.match(/^[a-zA-Z]+:/) || trimmed === '},' || trimmed === '}') {
                // Done with array
                output.push(`    ${arrayKey}: [${currentArrayItems.join(', ')}],`);
                inArray = false;
                output.push(line);
            } else {
                // Collect strings from this line
                let strings = line.match(/(".*?"|'.*?'|`.*?`)/g);
                if (strings) {
                    strings.forEach(s => {
                        currentArrayItems.push(s.replace(/^[`']|[`']$/g, '"'));
                    });
                }
            }
        } else {
            output.push(line);
        }
    }

    // Final check
    if (inArray) {
        output.push(`    ${arrayKey}: [${currentArrayItems.join(', ')}],`);
    }

    fs.writeFileSync(filePath, output.join('\n'));
    console.log(`Structure repaired in: ${filePath}`);
}

repairStructure('c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles.ts');
repairStructure('c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles/edevlet.ts');
