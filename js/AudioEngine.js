/**
 * AudioEngine class encapsulates all Tone.js audio logic.
 * Handles sound generation, effects, scales, and volume.
 */
class AudioEngine {
    constructor() {
        this.instrument = null; // Main oscillator for single continuous note
        this.previewLoop = null; // Tone.Loop for pulsing preview sound
        this.savedLoops = []; // Array to store multiple Tone.Loop instances
        this.masterBus = null; // Central gain node
        this.delayNode = null; // Feedback delay effect
        this.panner = null; // Stereo panner
        this.waveformAnalyzer = null; // Tone.Waveform analyzer
        this.fftAnalyzer = null; // Tone.FFT analyzer

        this.attackTime = 0.1;
        this.releaseTime = 0.5;
        this.delayWet = 0.3;
        this.userVolume = 0.8;
        this.maxFrequency = 880;

        this.currentScaleConfig = null;
        this.generatedScaleFrequencies = [];
        this.beta = 0;
        this.gamma = 0;

        this.availableScales = {
            'Off': { intervals: null },
            'Major': { intervals: [0, 2, 4, 5, 7, 9, 11] },
            'Minor': { intervals: [0, 2, 3, 5, 7, 8, 10] },
            'Pentatonic Major': { intervals: [0, 2, 4, 7, 9] },
            'Blues': { intervals: [0, 3, 5, 6, 7, 10] },
            'Chromatic': { intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
            'Dorian': { intervals: [0, 2, 3, 5, 7, 9, 10] },
            'Lydian': { intervals: [0, 2, 4, 6, 7, 9, 11] },
            'Harmonic Minor': { intervals: [0, 2, 3, 5, 7, 8, 11] },
            'Minor Pentatonic': { intervals: [0, 3, 5, 7, 10] },
            'Phrygian Minor': { intervals: [0, 1, 3, 5, 7, 8, 10] },
            'Mixolydian': { intervals: [0, 2, 4, 5, 7, 9, 10] },
            'Aeolian': { intervals: [0, 2, 3, 5, 7, 8, 10] },
            'Locrian': { intervals: [0, 1, 3, 5, 6, 8, 10] }
        };
    }

    /**
     * Initializes the audio graph and effects.
     */
    async init() {
        if (this.masterBus) return;

        this.masterBus = new Tone.Gain();
        const masterCompressor = new Tone.Compressor({
            threshold: -12,
            ratio: 4,
            attack: 0.01,
            release: 0.25
        });
        const lowBump = new Tone.Filter(200, "lowshelf");
        const reverb = new Tone.Reverb({ decay: 2, wet: 0.3 });
        await reverb.ready;

        this.delayNode = new Tone.FeedbackDelay("8n", 0.5);
        this.delayNode.wet.value = this.delayWet;

        this.panner = new Tone.Panner(0).toDestination();
        this.masterBus.chain(lowBump, masterCompressor, reverb, this.delayNode, this.panner);

        this.waveformAnalyzer = new Tone.Waveform(1024);
        this.fftAnalyzer = new Tone.FFT(1024);

        this.panner.connect(this.waveformAnalyzer);
        this.panner.connect(this.fftAnalyzer);

        this.updateMasterVolume();
    }

    /**
     * Generates scale frequencies based on root note and intervals.
     */
    generateScaleFrequencies(rootNote, intervals, minOctave = 3, maxOctave = 6) {
        const notes = [];
        const baseMidi = Tone.Midi(`${rootNote}${minOctave}`).toMidi();

        for (let octave = minOctave; octave <= maxOctave; octave++) {
            for (let interval of intervals) {
                const midiNote = baseMidi + (octave - minOctave) * 12 + interval;
                const freq = Tone.Frequency(midiNote, 'midi').toFrequency();
                if (freq >= 50 && freq <= this.maxFrequency * 1.5) {
                    notes.push(freq);
                }
            }
        }
        return notes.sort((a, b) => a - b);
    }

    /**
     * Updates scale settings and regenerates frequencies.
     */
    updateScale(scaleName, rootNote) {
        this.currentScaleConfig = this.availableScales[scaleName];
        if (this.currentScaleConfig && this.currentScaleConfig.intervals) {
            this.generatedScaleFrequencies = this.generateScaleFrequencies(rootNote, this.currentScaleConfig.intervals);
        } else {
            this.generatedScaleFrequencies = [];
        }
        this.clearSounds();
    }

    /**
     * Creates a new synth instance.
     */
    createSynth() {
        const selectedWaveform = document.getElementById('waveformSelect').value;
        const synthType = document.getElementById('synthTypeSelect').value;

        const settings = {
            oscillator: { type: selectedWaveform },
            envelope: {
                attack: this.attackTime,
                release: this.releaseTime
            }
        };

        let synth;
        switch (synthType) {
            case 'AMSynth':
                synth = new Tone.AMSynth(settings);
                break;
            case 'DuoSynth':
                synth = new Tone.DuoSynth(settings);
                break;
            case 'MonoSynth':
                synth = new Tone.MonoSynth(settings);
                break;
            case 'FMSynth':
            default:
                synth = new Tone.FMSynth(settings);
                break;
        }

        return synth.connect(this.masterBus);
    }

    /**
     * Snaps a frequency to the nearest scale frequency.
     */
    getSnappedFrequency(rawFreq) {
        if (this.generatedScaleFrequencies.length === 0) return rawFreq;

        let closestFreq = this.generatedScaleFrequencies[0];
        let minDifference = Math.abs(rawFreq - closestFreq);

        for (let i = 1; i < this.generatedScaleFrequencies.length; i++) {
            const currentFreq = this.generatedScaleFrequencies[i];
            const difference = Math.abs(rawFreq - currentFreq);
            if (difference < minDifference) {
                minDifference = difference;
                closestFreq = currentFreq;
            }
        }
        return closestFreq;
    }

    /**
     * Calculates the target frequency based on device orientation and scale.
     */
    getNormalizedFrequency() {
        let rawFreq = ((Math.sin(this.beta * (Math.PI / 180))) * this.maxFrequency + this.maxFrequency) / 2;
        if (this.currentScaleConfig && this.currentScaleConfig.intervals && this.generatedScaleFrequencies.length > 0) {
            rawFreq = this.getSnappedFrequency(rawFreq);
        }
        return rawFreq;
    }

    /**
     * Updates the frequency of the continuous instrument.
     */
    updateOrientation(beta, gamma) {
        this.beta = beta;
        this.gamma = gamma;

        const freq = this.getNormalizedFrequency();
        if (this.instrument) {
            this.instrument.frequency.rampTo(freq, 0.05);
        }

        if (this.panner) {
            const panValue = Math.max(-1, Math.min(1, this.gamma / 90));
            this.panner.pan.rampTo(panValue, 0.1);
        }
    }

    /**
     * Stops all sounds and clears loops.
     */
    clearSounds() {
        Tone.getTransport().stop();
        Tone.getTransport().cancel();
        Tone.getTransport().clear();

        if (this.instrument) {
            this.instrument.triggerRelease();
            const toDispose = this.instrument;
            setTimeout(() => toDispose.dispose(), this.releaseTime * 1000 + 100);
            this.instrument = null;
        }

        if (this.previewLoop) {
            this.previewLoop.stop();
            if (this.previewLoop.synth) {
                this.previewLoop.synth.triggerRelease();
                const toDispose = this.previewLoop.synth;
                setTimeout(() => toDispose.dispose(), this.releaseTime * 1000 + 100);
            }
            this.previewLoop.dispose();
            this.previewLoop = null;
        }

        this.savedLoops.forEach(loop => {
            loop.stop();
            if (loop.synth) {
                loop.synth.triggerRelease();
                const toDispose = loop.synth;
                setTimeout(() => toDispose.dispose(), this.releaseTime * 1000 + 100);
            }
            loop.dispose();
        });
        this.savedLoops = [];
        this.updateMasterVolume();
    }

    /**
     * Toggles the continuous single note.
     */
    toggleContinuousNote() {
        if (Tone.context.state !== 'running') Tone.start();

        if (this.instrument && this.instrument.active) {
            const currentInstrument = this.instrument;
            currentInstrument.triggerRelease();
            currentInstrument.active = false;
            this.instrument = null;
            setTimeout(() => currentInstrument.dispose(), this.releaseTime * 1000 + 100);
        } else {
            this.instrument = this.createSynth();
            this.instrument.triggerAttack(this.getNormalizedFrequency());
            this.instrument.active = true;
            if (Tone.getTransport().state !== 'started') Tone.getTransport().start();
        }
        this.updateMasterVolume();
    }

    /**
     * Starts the dynamic preview loop.
     */
    startPreviewLoop() {
        if (Tone.context.state !== 'running') Tone.start();

        if (this.instrument) {
            this.instrument.dispose();
            this.instrument = null;
        }

        if (this.previewLoop) {
            this.previewLoop.stop();
            if (this.previewLoop.synth) this.previewLoop.synth.dispose();
            this.previewLoop.dispose();
            this.previewLoop = null;
        }

        const synth = this.createSynth();
        this.previewLoop = new Tone.Loop((time) => {
            const currentFreq = this.getNormalizedFrequency();
            synth.triggerAttackRelease(currentFreq, "8n", time);
        }, "4n").start(0);

        this.previewLoop.synth = synth;
        if (Tone.getTransport().state !== 'started') Tone.getTransport().start();
        this.updateMasterVolume();
    }

    /**
     * Adds a fixed loop at the current frequency.
     */
    addFixedLoop() {
        if (Tone.context.state !== 'running') Tone.start();

        const fixedFrequency = this.getNormalizedFrequency();
        const synth = this.createSynth();
        const newLoop = new Tone.Loop((time) => {
            synth.triggerAttackRelease(fixedFrequency, "8n", time);
        }, "4n").start(0);

        newLoop.synth = synth;
        this.savedLoops.push(newLoop);
        if (Tone.getTransport().state !== 'started') Tone.getTransport().start();
        this.updateMasterVolume();
    }

    /**
     * Adjusts volume to prevent peaking and applies user volume.
     */
    updateMasterVolume() {
        let activeSoundCount = 0;
        if (this.instrument) activeSoundCount++;
        if (this.previewLoop) activeSoundCount++;
        activeSoundCount += this.savedLoops.length;

        const busGain = 1.0 / Math.max(1, activeSoundCount);
        if (this.masterBus) {
            this.masterBus.gain.rampTo(busGain, 0.1);
        }

        const volumeDb = Tone.gainToDb(this.userVolume);
        Tone.Destination.volume.rampTo(volumeDb, 0.1);
    }

    setAttack(value) { this.attackTime = value; }
    setRelease(value) { this.releaseTime = value; }
    setDelayWet(value) {
        this.delayWet = value;
        if (this.delayNode) this.delayNode.wet.rampTo(this.delayWet, 0.1);
    }
    setUserVolume(value) {
        this.userVolume = value;
        this.updateMasterVolume();
    }
}
