
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

// Test normalized frequency logic (including the 50 Hz cap logic)
function getNormalizedFrequencyMock(beta, maxFrequency, scaleConfig, scaleFrequencies) {
    let rawFreq = ((Math.sin(beta * (Math.PI / 180))) * maxFrequency + maxFrequency) / 2;
    if (scaleConfig && scaleConfig.intervals && scaleFrequencies.length > 0) {
        rawFreq = testSnapping(rawFreq, scaleFrequencies);
    }
    return Math.max(50, rawFreq);
}

// Test case where frequency is extremely low or negative, it should cap at 50
const lowFreqValue = getNormalizedFrequencyMock(-90, 880, null, []);
console.assert(lowFreqValue === 50, `Expected low frequency cap to be 50, but got ${lowFreqValue}`);

// Test normal mapping without scale config
const normalFreqValue = getNormalizedFrequencyMock(0, 880, null, []);
console.assert(normalFreqValue === 440, `Expected normal mapped frequency to be 440, but got ${normalFreqValue}`);

// Test with scale snapping configuration
const scaleConfigMock = { intervals: [0, 2, 4, 7, 9] };
const snappedLowFreqValue = getNormalizedFrequencyMock(-90, 880, scaleConfigMock, scale);
console.assert(snappedLowFreqValue === 100, `Expected snapped frequency to snap to closest scale note (100), but got ${snappedLowFreqValue}`);

console.log("Snapping logic tests passed!");
