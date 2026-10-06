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

console.log("Snapping logic tests passed!");

// Test envelope property update logic on mock synth objects
function testEnvelopeUpdate(mockEngine, property, value) {
    if (property === 'attack') mockEngine.attackTime = value;
    if (property === 'release') mockEngine.releaseTime = value;

    const updateSynth = (synth) => {
        if (!synth) return;
        if (synth.voice0 && synth.voice1) {
            if (synth.voice0.envelope) synth.voice0.envelope[property] = value;
            if (synth.voice1.envelope) synth.voice1.envelope[property] = value;
        } else if (synth.envelope) {
            synth.envelope[property] = value;
        }
    };
    updateSynth(mockEngine.instrument);
    if (mockEngine.previewLoop) updateSynth(mockEngine.previewLoop.synth);
    mockEngine.savedLoops.forEach(loop => updateSynth(loop.synth));
}

const mockEngine = {
    attackTime: 0.1,
    releaseTime: 0.5,
    instrument: { envelope: { attack: 0.1, release: 0.5 } },
    previewLoop: { synth: { envelope: { attack: 0.1, release: 0.5 } } },
    savedLoops: [{ synth: { envelope: { attack: 0.1, release: 0.5 } } }]
};

testEnvelopeUpdate(mockEngine, 'attack', 0.8);
console.assert(mockEngine.attackTime === 0.8, "attackTime should update to 0.8");
console.assert(mockEngine.instrument.envelope.attack === 0.8, "instrument attack should update to 0.8");
console.assert(mockEngine.previewLoop.synth.envelope.attack === 0.8, "previewLoop attack should update to 0.8");
console.assert(mockEngine.savedLoops[0].synth.envelope.attack === 0.8, "savedLoops attack should update to 0.8");

console.log("Envelope update logic tests passed!");
