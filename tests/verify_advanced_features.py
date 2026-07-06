import re
import os

def test_advanced_features():
    with open('index.html', 'r') as f:
        html_content = f.read()

    js_files = ['js/AudioEngine.js', 'js/InteractionHandler.js', 'js/main.js']
    js_content = ""
    for f_path in js_files:
        if os.path.exists(f_path):
            with open(f_path, 'r') as f:
                js_content += f.read() + "\n"

    # Check for new UI sections and elements in index.html
    expected_elements = [
        'Core Sound',
        'Effects',
        'id="reverbWetSlider"',
        'id="reverbDecaySlider"',
        'id="delayTimeSelect"'
    ]
    for element in expected_elements:
        if element not in html_content:
            print(f"Missing UI element or section: {element}")
            return False

    # Check for AudioEngine methods
    expected_methods = [
        'setReverbWet',
        'setReverbDecay',
        'setDelayTime',
        'updateWaveform',
        'updateSynthType'
    ]
    for method in expected_methods:
        if method not in js_content:
            print(f"Missing AudioEngine method: {method}")
            return False

    # Check for InteractionHandler wiring
    expected_wiring = [
        'reverbWetSlider.addEventListener',
        'reverbDecaySlider.addEventListener',
        'delayTimeSelect.addEventListener',
        'this.audioEngine.updateWaveform',
        'this.audioEngine.updateSynthType'
    ]
    for wiring in expected_wiring:
        if wiring not in js_content:
            print(f"Missing InteractionHandler wiring: {wiring}")
            return False

    # Check for DuoSynth oscillator update logic
    if 'synth.voice0.oscillator.type = selectedWaveform' not in js_content:
        print("Missing DuoSynth oscillator update logic in createSynth")
        return False

    return True

if __name__ == "__main__":
    if test_advanced_features():
        print("Advanced features verification passed!")
    else:
        exit(1)
