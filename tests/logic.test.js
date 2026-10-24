
// Mocking Tone.js for testing logic if needed, but here we focus on pure logic that can be extracted or tested with placeholders.
// Since AudioEngine depends on Tone.js and the DOM, we'll test the frequency snapping logic specifically.

function clampAndSnap(calculatedFreq, scaleFrequencies) {
    const rawFreq = Math.max(50, calculatedFreq);
    if (scaleFrequencies.length === 0) return rawFreq;
    return testSnapping(rawFreq, scaleFrequencies);
}

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

// Test clamping below 50 Hz boundary
console.assert(clampAndSnap(10, []) === 50, "Should clamp raw frequency below 50 Hz to 50 Hz");
console.assert(clampAndSnap(0, []) === 50, "Should clamp raw frequency 0 Hz to 50 Hz");

console.log("Snapping logic tests passed!");
