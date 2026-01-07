const fs = require('fs');

const encodedParams = "OVNpYHprdFI5UnFgeFpLYHdAdEw5UjZhcFV0TDlScj1QS1g4U0tgf1VKS2FvVXRSOVNPYHhaSHY5YFtgekB0TjlScm5UcUjCgFVacnw="; // From read_url_content fees
const KEY = 7;

// Current (Bad) Decode Logic (Client style simulation)
// In client: atob returns binary string.
// In Node: Buffer.from(..., 'base64') gives bytes.
// If we treat it as utf8, we get 'shifted'. 
// If we treat it as binary, we get garbage if it was utf8 encoded.

// Recovery Logic (Node style)
try {
    const b1 = Buffer.from(encodedParams, 'base64');
    const shifted = b1.toString('utf8'); // This should recover the multibyte chars correctly

    // Unshift
    const unshifted = shifted.split('').map(c => String.fromCharCode(c.charCodeAt(0) - KEY)).join('');

    // Decode original
    const original = Buffer.from(unshifted, 'base64').toString('utf8');

    console.log("Recovered:", original);
} catch (e) {
    console.log("Recovery failed:", e.message);
}

// Validation of FIX logic
function safeObfuscate(text) {
    const b1 = Buffer.from(text).toString('base64');
    const shifted = b1.split('').map(c => String.fromCharCode(c.charCodeAt(0) + KEY)).join('');
    // KEY FIX: use 'binary' to output exact bytes 
    return Buffer.from(shifted, 'binary').toString('base64');
}

function safeDeobfuscateClientSim(encoded) {
    // Client does: window.atob -> binary string
    // Node simulation:
    const b = Buffer.from(encoded, 'base64');
    const decoded1 = b.toString('binary');

    const unshifted = decoded1.split('').map(c => String.fromCharCode(c.charCodeAt(0) - KEY)).join('');

    // Client does: decodeURIComponent(escape(window.atob(unshifted)))
    // Node:
    return Buffer.from(unshifted, 'base64').toString('utf8');
}

const testText = "تجربة";
const badEnc = Buffer.from(
    Buffer.from(testText).toString('base64').split('').map(c => String.fromCharCode(c.charCodeAt(0) + 7)).join('')
).toString('base64'); // Default utf8

const goodEnc = safeObfuscate(testText);

console.log("Original:", testText);
console.log("Bad Enc:", badEnc);
console.log("Good Enc:", goodEnc);
console.log("Client Sim Bad:", safeDeobfuscateClientSim(badEnc)); // Should fail/garbage
console.log("Client Sim Good:", safeDeobfuscateClientSim(goodEnc)); // Should work
