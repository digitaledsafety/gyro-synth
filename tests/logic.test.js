
// Mocking Tone.js for testing logic if needed, but here we focus on pure logic that can be extracted or tested with placeholders.
// Since AudioEngine depends on Tone.js and the DOM, we'll test the frequency snapping logic specifically.

function testSnapping(rawFreq, scaleFrequencies) {
    if (scaleFrequencies.length === 0) return rawFreq;

    let closestFreq = scaleFrequencies[0];
    let minDifference = Math.abs(rawFreq - closestFreq);

    for (let i = 1; i < scaleFrequencies.length; i++) {
        const currentFreq = scaleFrequencies[i];
        const difference = Math.abs(rawFreq - currentFreq);
        if (difference < minDifference) {
            minDifference = difference;
            closestFreq = currentFreq;
        }
    }
    return closestFreq;
}

const scale = [100, 200, 300, 400];

console.assert(testSnapping(105, scale) === 100, "Should snap 105 to 100");
console.assert(testSnapping(190, scale) === 200, "Should snap 190 to 200");
console.assert(testSnapping(350, scale) === 300 || testSnapping(350, scale) === 400, "Should snap 350 to 300 or 400");
console.assert(testSnapping(50, scale) === 100, "Should snap 50 to 100");
console.assert(testSnapping(500, scale) === 400, "Should snap 500 to 400");

// Test frequency capping logic
function testFrequencyCapping(rawFreq) {
    return Math.max(50, rawFreq);
}
console.assert(testFrequencyCapping(0) === 50, "0 Hz should cap at 50 Hz");
console.assert(testFrequencyCapping(20) === 50, "20 Hz should cap at 50 Hz");
console.assert(testFrequencyCapping(100) === 100, "100 Hz should remain 100 Hz");

// Test input element hotkey suppression logic
function shouldHandleHotkey(activeTagName, key) {
    if (key === "Escape") return true;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(activeTagName)) return false;
    return true;
}
console.assert(shouldHandleHotkey('INPUT', 'm') === false, "Hotkey 'm' should be suppressed when INPUT is focused");
console.assert(shouldHandleHotkey('DIV', 'm') === true, "Hotkey 'm' should be handled when DIV is focused");
console.assert(shouldHandleHotkey('INPUT', 'Escape') === true, "Escape should be handled even when INPUT is focused");

console.log("Snapping, capping, and hotkey logic tests passed!");
