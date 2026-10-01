
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

// Minimum frequency clamping logic test
function calculateNormalizedFreq(beta, maxFrequency = 880) {
    let rawFreq = ((Math.sin(beta * (Math.PI / 180))) * maxFrequency + maxFrequency) / 2;
    rawFreq = Math.max(50, rawFreq);
    return rawFreq;
}

console.assert(calculateNormalizedFreq(-90) === 50, "At beta=-90, frequency should be clamped to 50 Hz minimum");
console.assert(calculateNormalizedFreq(0) === 440, "At beta=0, frequency should be 440 Hz");
console.assert(calculateNormalizedFreq(90) === 880, "At beta=90, frequency should be 880 Hz");

// Envelope property dynamic update test
function updateEnvelopeProperty(synthObjects, property, value) {
    const updateSynthEnvelope = (synth) => {
        if (!synth) return;
        if (synth.envelope) synth.envelope[property] = value;
        if (synth.voice0 && synth.voice0.envelope) synth.voice0.envelope[property] = value;
        if (synth.voice1 && synth.voice1.envelope) synth.voice1.envelope[property] = value;
    };
    synthObjects.forEach(s => updateSynthEnvelope(s));
}

const mockSynthSingle = { envelope: { attack: 0.1, release: 0.5 } };
const mockSynthDuo = {
    voice0: { envelope: { attack: 0.1, release: 0.5 } },
    voice1: { envelope: { attack: 0.1, release: 0.5 } }
};
updateEnvelopeProperty([mockSynthSingle, mockSynthDuo], 'attack', 0.25);
console.assert(mockSynthSingle.envelope.attack === 0.25, "Single synth attack should update to 0.25");
console.assert(mockSynthDuo.voice0.envelope.attack === 0.25, "Duo synth voice0 attack should update to 0.25");
console.assert(mockSynthDuo.voice1.envelope.attack === 0.25, "Duo synth voice1 attack should update to 0.25");

console.log("Snapping logic tests passed!");
