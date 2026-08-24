import re
import os

def test_new_params_and_ui():
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
        'id="attackSlider"',
        'id="releaseSlider"',
        'id="delayWetSlider"',
        'id="synthTypeSelect"'
    ]
    for element in new_ui_elements:
        if element not in html_content:
            print(f"Missing UI element: {element}")
            return False

    # Check for event listeners in JS files
    listeners = [
        'attackSlider.addEventListener',
        'releaseSlider.addEventListener',
        'delayWetSlider.addEventListener'
    ]
    for listener in listeners:
        if listener not in js_content:
            print(f"Missing event listener: {listener}")
            return False

    # Check for Ripple call in pointerdown (it's now in InteractionHandler.js calling visualizer.createRipple)
    if 'this.visualizer.createRipple(event.clientX, event.clientY)' not in js_content:
        print("Missing createRipple call in pointerdown")
        return False

    # Check for service-worker cache version v5
    if os.path.exists('service-worker.js'):
        with open('service-worker.js', 'r') as sw_file:
            sw_content = sw_file.read()
            if 'gyro-synth-cache-v5' not in sw_content:
                print("Missing gyro-synth-cache-v5 in service-worker.js")
                return False

    return True

if __name__ == "__main__":
    if test_new_params_and_ui():
        print("New parameters and UI checks passed!")
    else:
        exit(1)
