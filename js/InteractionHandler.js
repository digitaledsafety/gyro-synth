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

    setupOrientationEvents() {
        window.addEventListener("deviceorientation", (event) => {
            const beta = event.beta !== null ? event.beta.valueOf() : 0;
            const gamma = event.gamma !== null ? event.gamma.valueOf() : 0;

            const modal = document.getElementById('settingsModal');
            const isVisible = modal && modal.classList.contains('visible');

            if (isVisible) {
                const betaDisplay = document.getElementById('betaDisplay');
                if (betaDisplay) betaDisplay.textContent = `Beta: ${beta.toFixed(1)}°`;
                const gammaDisplay = document.getElementById('gammaDisplay');
                if (gammaDisplay) gammaDisplay.textContent = `Gamma: ${gamma.toFixed(1)}°`;
            }

            this.audioEngine.updateOrientation(beta, gamma);
        }, true);
    }

    setupKeyboardEvents() {
        window.addEventListener("keydown", (e) => {
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
