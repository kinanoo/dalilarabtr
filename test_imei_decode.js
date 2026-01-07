const fs = require('fs');

const encodedParams = "OVNpYHprdFI5UnFgeFpLYHdAdEw5UjZhcFV0TDlScj1QS1g4U0tgf1VKS2FvVXRSOVNPYHhaSHY5YFtgekB0TjlScm5UcUjCgFVacnw=";
const KEY = 7;

try {
    // Client Logic Simulation
    // 1. atob
    const b1 = Buffer.from(encodedParams, 'base64');
    const decoded1 = b1.toString('binary');

    // 2. Unshift
    const unshifted = decoded1.split('').map(c => String.fromCharCode(c.charCodeAt(0) - KEY)).join('');

    // 3. atob (final)
    // In Node we use Buffer from binary string -> utf8
    // But Buffer.from(string, 'base64') expects base64 chars.
    // unshifted should be base64 chars.
    const original = Buffer.from(unshifted, 'base64').toString('utf8');

    console.log("Decoded Result:", original);
} catch (e) {
    console.log("Decode error:", e.message);
}
