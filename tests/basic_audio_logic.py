import re
import os

def test_js_logic_integrity():
    # Load all relevant JS files
    js_files = ['js/AudioEngine.js', 'js/Visualizer.js', 'js/InteractionHandler.js', 'js/main.js']
    content = ""
    for f_path in js_files:
        if os.path.exists(f_path):
            with open(f_path, 'r') as f:
                content += f.read() + "\n"

    # Check for memory leak fix
    if 'this.previewLoop.dispose();' not in content and 'previewLoop.dispose();' not in content:
        print("Missing previewLoop.dispose();")
        return False

    # Check for FeedbackDelay
    if 'new Tone.FeedbackDelay' not in content:
        print("Missing Tone.FeedbackDelay")
        return False

    # Check for attack and release variables/properties
    if 'this.attackTime = 0.1;' not in content and 'let attackTime = 0.1;' not in content:
        print("Missing attackTime")
        return False
    if 'this.releaseTime = 0.5;' not in content and 'let releaseTime = 0.5;' not in content:
        print("Missing releaseTime")
        return False

    # Check for timing update
    if 'performance.now()' not in content:
        print("Missing performance.now()")
        return False

    # Check for Reverb
    if 'new Tone.Reverb' not in content:
        print("Missing Tone.Reverb")
        return False
    if 'await this.reverb.ready' not in content and 'await reverb.ready' not in content:
        print("Missing await reverb.ready")
        return False

    # Check for scales
    if "'Mixolydian'" not in content:
        print("Missing Mixolydian scale")
        return False

    # Check for UI update logic
    if 'frequencyDisplay' not in content:
        print("Missing frequencyDisplay")
        return False

    return True

if __name__ == "__main__":
    if test_js_logic_integrity():
        print("JS logic integrity checks passed!")
    else:
        exit(1)
