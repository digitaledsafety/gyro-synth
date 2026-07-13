import re
import os

def test_enhanced_params_and_ui():
    with open('index.html', 'r') as f:
        html_content = f.read()

    js_files = ['js/AudioEngine.js', 'js/InteractionHandler.js']
    js_content = ""
    for f_path in js_files:
        if os.path.exists(f_path):
            with open(f_path, 'r') as f:
                js_content += f.read() + "\n"

    # Check for new UI elements in index.html
    enhanced_ui_elements = [
        'id="decaySlider"',
        'id="sustainSlider"',
        'id="delayFeedbackSlider"',
        'id="reverbWetSlider"',
        'id="reverbDecaySlider"'
    ]
    for element in enhanced_ui_elements:
        if element not in html_content:
            print(f"Missing UI element: {element}")
            return False

    # Check for new event listeners in InteractionHandler.js
    new_listeners = [
        'decaySlider.addEventListener',
        'sustainSlider.addEventListener',
        'delayFeedbackSlider.addEventListener',
        'reverbWetSlider.addEventListener',
        'reverbDecaySlider.addEventListener'
    ]
    for listener in new_listeners:
        if listener not in js_content:
            print(f"Missing event listener in JS: {listener}")
            return False

    # Check for AudioEngine logic updates
    engine_logic = [
        'this.decayTime = 0.5',
        'this.sustainLevel = 0.5',
        'this.reverbWet = 0.3',
        'this.reverbDecay = 2.0',
        'this.delayFeedback = 0.5',
        'this.reverb = new Tone.Reverb',
        'setDecay(value)',
        'setSustain(value)',
        'setReverbWet(value)',
        'setReverbDecay(value)',
        'setDelayFeedback(value)'
    ]
    for logic in engine_logic:
        if logic not in js_content:
            print(f"Missing engine logic: {logic}")
            return False

    # Check for InteractionHandler timer clearing
    if 'this.pressTimers.forEach((timer) => clearTimeout(timer))' not in js_content:
        print("Missing timer clearing in pointerdown")
        return False

    return True

if __name__ == "__main__":
    if test_enhanced_params_and_ui():
        print("Enhanced parameters and UI checks passed!")
    else:
        exit(1)
