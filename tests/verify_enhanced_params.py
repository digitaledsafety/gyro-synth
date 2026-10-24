import os
import re

def test_enhanced_params_and_fixes():
    # 1. Read AudioEngine.js
    with open('js/AudioEngine.js', 'r') as f:
        audio_content = f.read()

    # Verify no document.getElementById queries in AudioEngine.js
    if 'document.getElementById' in audio_content:
        print("FAIL: AudioEngine.js should be decoupled from DOM (no document.getElementById)")
        return False

    # Verify min frequency cap of 50 Hz in getNormalizedFrequency
    if 'rawFreq = Math.max(50, rawFreq)' not in audio_content:
        print("FAIL: AudioEngine.js should cap rawFreq to a minimum of 50 Hz")
        return False

    # Verify serialized reverb decay logic
    reverb_pattern = r'_generatingReverb\s*=\s*true'
    if not re.search(reverb_pattern, audio_content):
        print("FAIL: AudioEngine.js should implement a lock for reverb decay generation")
        return False

    # 2. Read Visualizer.js
    with open('js/Visualizer.js', 'r') as f:
        visualizer_content = f.read()

    # Verify the bar width update on resize (merge selection)
    if 'attr("width", barWidth * 0.8)' not in visualizer_content:
        print("FAIL: Visualizer.js must update bar width in the merge selection")
        return False

    # Check that width is in the merge block, after merge(bars)
    merge_index = visualizer_content.find('.merge(bars)')
    width_index = visualizer_content.find('.attr("width", barWidth * 0.8)')
    if merge_index == -1 or width_index == -1 or width_index < merge_index:
        print("FAIL: Visualizer.js must specify the width attribute within the merge/update block")
        return False

    return True

if __name__ == "__main__":
    if test_enhanced_params_and_fixes():
        print("Enhanced params and bug fixes checks passed successfully!")
    else:
        exit(1)
