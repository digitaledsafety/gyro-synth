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

    # Check for new AudioEngine properties
    new_props = [
        'this.decayTime = 0.2;',
        'this.sustainLevel = 0.5;',
        'this.delayFeedback = 0.5;',
        'this.reverbWet = 0.3;',
        'this.reverbDecay = 2;'
    ]
    for prop in new_props:
        if prop not in js_content:
            print(f"Missing AudioEngine property: {prop}")
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

    return True

if __name__ == "__main__":
    if test_enhanced_params_and_ui():
        print("Enhanced parameters and UI checks passed!")
    else:
        exit(1)
