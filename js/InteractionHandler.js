/**
 * InteractionHandler class manages all user inputs.
 * Handles pointer gestures, device orientation, and keyboard shortcuts.
 */
class InteractionHandler {
    constructor(audioEngine, visualizer) {
        this.audioEngine = audioEngine;
        this.visualizer = visualizer;

        this.pressTimers = new Map();
        this.longPressDuration = 500;
        this.isLongPress = false;
        this.lastTapTime = 0;
        this.doubleTapThreshold = 300;
        this.activePointers = new Set();
        this.hasRealOrientation = false;

        this.init();
    }

    init() {
        this.populateScales();
        this.setupPointerEvents();
        this.setupOrientationEvents();
        this.setupKeyboardEvents();
        this.setupUIEvents();
    }

    populateScales() {
        const scaleSelect = document.getElementById('scaleSelect');
        if (!scaleSelect) return;
        scaleSelect.innerHTML = '';
        for (const scaleName in this.audioEngine.availableScales) {
            const option = document.createElement('option');
            option.value = scaleName;
            option.textContent = scaleName;
            scaleSelect.appendChild(option);
        }
        scaleSelect.value = 'Off';
        const rootNoteSelect = document.getElementById('rootNoteSelect');
        if (rootNoteSelect) {
            rootNoteSelect.disabled = true;
        }
    }

    setupPointerEvents() {
        const svg = this.visualizer.waveformSvg;

        svg.on("pointerdown", (event) => {
            this.activePointers.add(event.pointerId);
            if (this.activePointers.size === 1) {
                this.isLongPress = false;
            }
            this.visualizer.createRipple(event.clientX, event.clientY);

            // Handle virtual orientation fallback if real orientation isn't present
            if (!this.hasRealOrientation) {
                this.updateVirtualOrientation(event.clientX, event.clientY);
            }

            const timer = setTimeout(() => {
                if (this.isLongPress) return;
                this.isLongPress = true;
                if (this.activePointers.size >= 2) {
                    this.showSettings();
                } else {
                    this.audioEngine.toggleContinuousNote();
                }
            }, this.longPressDuration);
            this.pressTimers.set(event.pointerId, timer);
        });

        svg.on("pointermove", (event) => {
            if (this.activePointers.has(event.pointerId) && !this.hasRealOrientation) {
                this.updateVirtualOrientation(event.clientX, event.clientY);
            }
        });

        svg.on("pointerup", (event) => {
            this.activePointers.delete(event.pointerId);
            const timer = this.pressTimers.get(event.pointerId);
            if (timer) {
                clearTimeout(timer);
                this.pressTimers.delete(event.pointerId);
            }

            if (this.isLongPress) {
                if (this.activePointers.size === 0) this.isLongPress = false;
                return;
            }

            if (this.activePointers.size === 0) {
                const currentTime = performance.now();
                if (currentTime - this.lastTapTime < this.doubleTapThreshold) {
                    this.audioEngine.clearSounds();
                    this.lastTapTime = 0;
                } else {
                    if (this.audioEngine.instrument || this.audioEngine.previewLoop || this.audioEngine.savedLoops.length > 0) {
                        this.audioEngine.addFixedLoop();
                    } else {
                        this.audioEngine.startPreviewLoop();
                    }
                    this.lastTapTime = currentTime;
                }
            }
            event.preventDefault();
        });

        svg.on("pointercancel", (event) => {
            this.activePointers.delete(event.pointerId);
            const timer = this.pressTimers.get(event.pointerId);
            if (timer) {
                clearTimeout(timer);
                this.pressTimers.delete(event.pointerId);
            }
        });
    }

    updateVirtualOrientation(clientX, clientY) {
        // Map clientX/clientY to virtual beta and gamma values
        // beta maps Y coordinate to pitch: top is max pitch, bottom is min pitch
        // gamma maps X coordinate to stereo panning: left is -90 (full left), right is 90 (full right)
        const width = window.innerWidth;
        const height = window.innerHeight;

        // beta range from -90 to 90 (or mapped normalized)
        // In AudioEngine: let rawFreq = ((Math.sin(this.beta * (Math.PI / 180))) * this.maxFrequency + this.maxFrequency) / 2;
        // So we want virtualBeta mapping to follow a full sine range or direct mapping.
        // Let's map Y to an equivalent beta. Top (Y=0) is high pitch, Bottom (Y=height) is low pitch.
        // If we map Y/height from 0 to 1, we can compute an angle beta such that Math.sin(beta * Radian) matches 1 to -1.
        // At Y=0 (top), we want Math.sin(...) = 1 -> beta = 90.
        // At Y=height (bottom), we want Math.sin(...) = -1 -> beta = -90.
        const yPct = clientY / height;
        const virtualBeta = 90 - (yPct * 180);

        // gamma range -90 to 90
        const xPct = clientX / width;
        const virtualGamma = -90 + (xPct * 180);

        const betaDisplay = document.getElementById('betaDisplay');
        if (betaDisplay) betaDisplay.textContent = `Beta: ${virtualBeta.toFixed(1)}° (v)`;
        const gammaDisplay = document.getElementById('gammaDisplay');
        if (gammaDisplay) gammaDisplay.textContent = `Gamma: ${virtualGamma.toFixed(1)}° (v)`;

        this.audioEngine.updateOrientation(virtualBeta, virtualGamma);
    }

    setupOrientationEvents() {
        window.addEventListener("deviceorientation", (event) => {
            if (event.beta !== null && event.beta !== undefined && event.beta !== 0) {
                this.hasRealOrientation = true;
            }

            const beta = event.beta !== null ? event.beta.valueOf() : 0;
            const gamma = event.gamma !== null ? event.gamma.valueOf() : 0;

            const betaDisplay = document.getElementById('betaDisplay');
            if (betaDisplay) betaDisplay.textContent = `Beta: ${beta.toFixed(1)}°`;
            const gammaDisplay = document.getElementById('gammaDisplay');
            if (gammaDisplay) gammaDisplay.textContent = `Gamma: ${gamma.toFixed(1)}°`;

            this.audioEngine.updateOrientation(beta, gamma);
        }, true);
    }

    setupKeyboardEvents() {
        window.addEventListener("keydown", (e) => {
            const startOverlay = document.getElementById('startOverlay');
            // If the start overlay is still active / visible, ignore 'm' or escape keys
            if (startOverlay && startOverlay.style.display !== 'none') {
                return;
            }
            if (e.key.toLowerCase() === "m") {
                this.showSettings();
            } else if (e.key === "Escape") {
                this.hideSettings();
            }
        });
    }

    setupUIEvents() {
        const startButton = document.getElementById('startButton');
        const startOverlay = document.getElementById('startOverlay');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const clearAllBtn = document.getElementById('clearAllBtn');

        startButton.addEventListener('click', async () => {
            await Tone.start();
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    await DeviceOrientationEvent.requestPermission();
                } catch (err) {
                    console.error('Error requesting orientation permission:', err);
                }
            }
            startOverlay.style.display = 'none';
            // Wake lock handled separately in main or here
        });

        closeSettingsBtn.addEventListener('click', () => this.hideSettings());
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) this.hideSettings();
        });
        clearAllBtn.addEventListener('click', () => this.audioEngine.clearSounds());

        // Selects and Sliders
        const scaleSelect = document.getElementById('scaleSelect');
        const rootNoteSelect = document.getElementById('rootNoteSelect');
        const synthTypeSelect = document.getElementById('synthTypeSelect');
        const waveformSelect = document.getElementById('waveformSelect');
        const volumeSlider = document.getElementById('volumeSlider');
        const attackSlider = document.getElementById('attackSlider');
        const releaseSlider = document.getElementById('releaseSlider');
        const delayWetSlider = document.getElementById('delayWetSlider');
        const delayTimeSelect = document.getElementById('delayTimeSelect');
        const reverbWetSlider = document.getElementById('reverbWetSlider');
        const reverbDecaySlider = document.getElementById('reverbDecaySlider');
        const filterCutoffSlider = document.getElementById('filterCutoffSlider');
        const filterQSlider = document.getElementById('filterQSlider');
        const visModeSelect = document.getElementById('visModeSelect');

        const updateScaleSettings = () => {
            this.audioEngine.updateScale(scaleSelect.value, rootNoteSelect.value);
            rootNoteSelect.disabled = scaleSelect.value === 'Off';
        };

        scaleSelect.addEventListener('change', updateScaleSettings);
        rootNoteSelect.addEventListener('change', updateScaleSettings);
        synthTypeSelect.addEventListener('change', (e) => this.audioEngine.updateSynthType(e.target.value));
        waveformSelect.addEventListener('change', (e) => this.audioEngine.updateWaveform(e.target.value));
        volumeSlider.addEventListener('input', (e) => this.audioEngine.setUserVolume(parseFloat(e.target.value)));
        attackSlider.addEventListener('input', (e) => this.audioEngine.setAttack(parseFloat(e.target.value)));
        releaseSlider.addEventListener('input', (e) => this.audioEngine.setRelease(parseFloat(e.target.value)));
        delayWetSlider.addEventListener('input', (e) => this.audioEngine.setDelayWet(parseFloat(e.target.value)));
        if (delayTimeSelect) {
            delayTimeSelect.addEventListener('change', (e) => this.audioEngine.setDelayTime(e.target.value));
        }
        if (reverbWetSlider) {
            reverbWetSlider.addEventListener('input', (e) => this.audioEngine.setReverbWet(parseFloat(e.target.value)));
        }
        if (reverbDecaySlider) {
            reverbDecaySlider.addEventListener('change', (e) => this.audioEngine.setReverbDecay(parseFloat(e.target.value)));
        }
        if (filterCutoffSlider) {
            filterCutoffSlider.addEventListener('input', (e) => this.audioEngine.setFilterCutoff(parseFloat(e.target.value)));
        }
        if (filterQSlider) {
            filterQSlider.addEventListener('input', (e) => this.audioEngine.setFilterQ(parseFloat(e.target.value)));
        }
        visModeSelect.addEventListener('change', (e) => this.visualizer.setVisMode(e.target.value));
    }

    showSettings() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = "flex";
        setTimeout(() => modal.classList.add('visible'), 10);
    }

    hideSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('visible');
        setTimeout(() => {
            if (!modal.classList.contains('visible')) {
                modal.style.display = "none";
            }
        }, 300);
    }
}
