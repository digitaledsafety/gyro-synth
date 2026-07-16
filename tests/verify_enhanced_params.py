import re
import os

def test_enhanced_params_and_ui():
    with open('index.html', 'r') as f:
        html_content = f.read()

    js_files = ['js/AudioEngine.js', 'js/Visualizer.js', 'js/InteractionHandler.js', 'js/main.js']
    js_content = ""
    for f_path in js_files:
        if os.path.exists(f_path):
            with open(f_path, 'r') as f:
                js_content += f.read() + "\n"

    # Check for new UI elements in index.html
    new_ui_elements = [
        'id="decaySlider"',
        'id="sustainSlider"',
        'id="delayFeedbackSlider"',
        'id="reverbWetSlider"',
        'id="reverbDecaySlider"'
    ]
    for element in new_ui_elements:
        if element not in html_content:
            print(f"Missing UI element: {element}")
            return False

    # Check for event listeners in JS files
    listeners = [
        'decaySlider.addEventListener',
        'sustainSlider.addEventListener',
        'delayFeedbackSlider.addEventListener',
        'reverbWetSlider.addEventListener',
        'reverbDecaySlider.addEventListener'
    ]
    for listener in listeners:
        if listener not in js_content:
            print(f"Missing event listener: {listener}")
            return False

    # Check for AudioEngine methods and properties
    expected_js_substrings = [
        'this.decayTime',
        'this.sustainLevel',
        'this.delayFeedback',
        'this.reverbWet',
        'this.reverbDecay',
        'setDecay',
        'setSustain',
        'setDelayFeedback',
        'setReverbWet',
        'setReverbDecay',
        'this.reverb = new Tone.Reverb'
    ]
    for substring in expected_js_substrings:
        if substring not in js_content:
            print(f"Missing expected JS logic: {substring}")
            return False

    return True

if __name__ == "__main__":
    if test_enhanced_params_and_ui():
        print("Enhanced parameters and UI checks passed!")
    else:
        exit(1)
