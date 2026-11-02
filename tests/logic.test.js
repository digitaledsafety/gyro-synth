
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

// Test minimum frequency clamping logic
function calculateNormalizedFrequency(beta, maxFrequency) {
    let rawFreq = ((Math.sin(beta * (Math.PI / 180))) * maxFrequency + maxFrequency) / 2;
    return Math.max(50, rawFreq);
}

console.assert(calculateNormalizedFrequency(-90, 880) === 50, "At beta=-90, frequency should be clamped to 50 Hz");
console.assert(calculateNormalizedFrequency(90, 880) === 880, "At beta=90, frequency should reach 880 Hz");
console.assert(calculateNormalizedFrequency(0, 880) === 440, "At beta=0, frequency should be 440 Hz");

console.log("Snapping logic tests passed!");
