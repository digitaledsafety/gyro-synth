import re
import os

def test_extended_js_logic():
    # Load all relevant JS files
    js_files = ['js/AudioEngine.js', 'js/Visualizer.js', 'js/InteractionHandler.js', 'js/main.js']
    content = ""
    for f_path in js_files:
        if os.path.exists(f_path):
            with open(f_path, 'r') as f:
                content += f.read() + "\n"

    # Check for masterBus initialization
    if 'this.masterBus = null;' not in content and 'let masterBus = null;' not in content:
        print("Missing masterBus initialization")
        return False

    # Check for userVolume presence
    if 'this.userVolume = 0.8;' not in content and 'let userVolume = 0.8;' not in content:
        print("Missing userVolume initialization")
        return False

    # Check for createSynth helper function
    if 'createSynth()' not in content:
        print("Missing createSynth function")
        return False

    # Check for Ripple effect
    if 'createRipple' not in content:
        print("Missing createRipple function")
        return False

    # Check for activePointers
    if 'this.activePointers = new Map();' not in content and 'let activePointers = new Map();' not in content:
        print("Missing activePointers initialization")
        return False

    # Check for updated compressor settings
    if 'threshold: -12' not in content:
        print("Missing updated compressor threshold")
        return False
    if 'ratio: 4' not in content:
        print("Missing updated compressor ratio")
        return False

    # Check for updated updateMasterVolume logic
    if '1.0 / Math.max(1, activeSoundCount)' not in content:
        print("Missing updated gain calculation in updateMasterVolume")
        return False

    # Check for pointer events
    if 'pointerdown' not in content:
        print("Missing pointerdown event listener")
        return False
    if 'pointerup' not in content:
        print("Missing pointerup event listener")
        return False

    # Check for Panner
    if 'new Tone.Panner' not in content:
        print("Missing Tone.Panner initialization")
        return False

    return True

if __name__ == "__main__":
    if test_extended_js_logic():
        print("Extended JS logic integrity checks passed!")
    else:
        exit(1)
