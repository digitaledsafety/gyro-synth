const { test, expect } = require('@playwright/test');

test.describe('Gyro Synth Frontend Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Serve the app locally using the configured baseURL
    await page.goto('/');
  });

  test('should show start overlay on load', async ({ page }) => {
    const overlay = page.locator('#startOverlay');
    await expect(overlay).toBeVisible();

    const startButton = page.locator('#startButton');
    await expect(startButton).toBeVisible();
    await expect(startButton).toHaveText('Tap to Start');
  });

  test('should hide overlay and show visualizer on start', async ({ page }) => {
    const startButton = page.locator('#startButton');
    await startButton.click();

    const overlay = page.locator('#startOverlay');
    await expect(overlay).toBeHidden();

    const visualizer = page.locator('#waveformSvg');
    await expect(visualizer).toBeVisible();
  });

  test('should have necessary settings controls', async ({ page }) => {
    // Start app first so 'm' hotkey works
    await page.locator('#startButton').click();
    await expect(page.locator('#startOverlay')).toBeHidden();

    // Open settings (assuming 'm' key or similar, but let's check if it exists in DOM)
    const modal = page.locator('#settingsModal');

    // Trigger settings modal via keydown 'm'
    await page.keyboard.press('m');
    await expect(modal).toBeVisible();

    await expect(page.locator('#rootNoteSelect')).toBeVisible();
    await expect(page.locator('#scaleSelect')).toBeVisible();
    await expect(page.locator('#waveformSelect')).toBeVisible();
    await expect(page.locator('#volumeSlider')).toBeVisible();
    await expect(page.locator('#clearAllBtn')).toBeVisible();

    // Check new parameters/controls
    await expect(page.locator('#reverbWetSlider')).toBeVisible();
    await expect(page.locator('#reverbDecaySlider')).toBeVisible();
    await expect(page.locator('#delayTimeSelect')).toBeVisible();
    await expect(page.locator('#filterCutoffSlider')).toBeVisible();
    await expect(page.locator('#filterQSlider')).toBeVisible();
  });

  test('should display beta and gamma values', async ({ page }) => {
    await page.locator('#startButton').click();
    await expect(page.locator('#startOverlay')).toBeHidden();
    await page.keyboard.press('m');
    await expect(page.locator('#betaDisplay')).toContainText('Beta:');
    await expect(page.locator('#gammaDisplay')).toContainText('Gamma:');
  });

  test('should apply virtual orientation fallback on pointerdown and pointermove on desktop', async ({ page }) => {
    await page.locator('#startButton').click();
    await expect(page.locator('#startOverlay')).toBeHidden();

    // Initially betaDisplay / gammaDisplay are zero or initial values
    const visualizer = page.locator('#waveformSvg');
    const box = await visualizer.boundingBox();
    expect(box).not.toBeNull();

    // Click on the SVG to trigger virtual fallback while the modal is closed (so backdrop doesn't block the pointer events)
    await page.mouse.move(box.x + box.width / 4, box.y + box.height / 4);
    await page.mouse.down();

    // Now open the settings modal to inspect the display values
    await page.keyboard.press('m');
    await expect(page.locator('#settingsModal')).toBeVisible();

    // Check that betaDisplay/gammaDisplay reflect virtual value mapped from pointer
    const betaText = await page.locator('#betaDisplay').textContent();
    const gammaText = await page.locator('#gammaDisplay').textContent();
    expect(betaText).toContain('(v)');
    expect(gammaText).toContain('(v)');

    // Close the settings modal to perform further pointer movement on the SVG
    await page.keyboard.press('Escape');
    await expect(page.locator('#settingsModal')).toBeHidden();

    // Move mouse and verify update
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

    // Reopen the modal to check the new virtual values
    await page.keyboard.press('m');
    await expect(page.locator('#settingsModal')).toBeVisible();

    const betaTextMove = await page.locator('#betaDisplay').textContent();
    const gammaTextMove = await page.locator('#gammaDisplay').textContent();
    expect(betaTextMove).not.toEqual(betaText);
    expect(gammaTextMove).not.toEqual(gammaText);

    await page.keyboard.press('Escape');
    await page.mouse.up();
  });

  test('should verify accessibility properties on key interactive components', async ({ page }) => {
    // Check overlay start button accessibility label
    const startButton = page.locator('#startButton');
    await expect(startButton).toHaveAttribute('aria-label', /Start application/);

    // Click start to expose settings button
    await startButton.click();
    await expect(page.locator('#startOverlay')).toBeHidden();
    await page.keyboard.press('m');

    // Check modal close button accessibility
    const closeBtn = page.locator('#closeSettingsBtn');
    await expect(closeBtn).toHaveAttribute('aria-label', 'Close settings');

    // Check modal role and labeledby properties
    const modal = page.locator('#settingsModal');
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-labelledby', 'settingsTitle');

    // Check slider labels
    await expect(page.locator('#attackSlider')).toHaveAttribute('aria-label', 'Synth Attack Time');
    await expect(page.locator('#releaseSlider')).toHaveAttribute('aria-label', 'Synth Release Time');
    await expect(page.locator('#reverbWetSlider')).toHaveAttribute('aria-label', 'Reverb Wet Level');
    await expect(page.locator('#reverbDecaySlider')).toHaveAttribute('aria-label', 'Reverb Decay Time');
    await expect(page.locator('#delayWetSlider')).toHaveAttribute('aria-label', 'Delay Wet Level');
    await expect(page.locator('#filterCutoffSlider')).toHaveAttribute('aria-label', 'Filter Cutoff Frequency');
    await expect(page.locator('#filterQSlider')).toHaveAttribute('aria-label', 'Filter Resonance Q');
    await expect(page.locator('#volumeSlider')).toHaveAttribute('aria-label', 'Master Volume Level');
  });

  test('should not show settings modal on keypress "m" when start overlay is active', async ({ page }) => {
    // On load, modal should be hidden even if 'm' key is pressed
    await page.keyboard.press('m');
    const modal = page.locator('#settingsModal');
    await expect(modal).toBeHidden();
  });
});
