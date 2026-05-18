const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Gyro Synth Logic Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Serve the app locally. We assume a server is running or we use file://
    // Since we don't have a server yet, let's use the absolute path.
    const absolutePath = 'file://' + path.resolve('index.html');
    await page.goto(absolutePath);
    // Wait for Tone to be defined
    await page.waitForFunction(() => typeof Tone !== 'undefined');
  });

  test('generateScaleFrequencies should return correct frequencies', async ({ page }) => {
    const result = await page.evaluate(() => {
      const intervals = [0, 2, 4, 5, 7, 9, 11]; // Major scale
      return generateScaleFrequencies('C', intervals, 4, 4);
    });

    // C4 major scale frequencies
    // C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88
    expect(result.length).toBe(7);
    expect(result[0]).toBeCloseTo(261.63, 1);
    expect(result[6]).toBeCloseTo(493.88, 1);
  });

  test('getSnappedFrequency should snap to closest scale frequency', async ({ page }) => {
    await page.evaluate(() => {
      // Set up a major scale on C
      const rootNote = 'C';
      const intervals = [0, 2, 4, 5, 7, 9, 11];
      generatedScaleFrequencies = generateScaleFrequencies(rootNote, intervals, 4, 4);
      currentScaleConfig = { intervals };
    });

    const snapped = await page.evaluate(() => {
      return getSnappedFrequency(280); // Close to D4 (293.66) or C4 (261.63)?
      // 280 - 261.63 = 18.37
      // 293.66 - 280 = 13.66
      // Should be D4
    });

    expect(snapped).toBeCloseTo(293.66, 1);
  });

  test('getNormalizedValue should return a frequency within range', async ({ page }) => {
    const freq = await page.evaluate(() => {
      beta = 45; // some tilt
      return getNormalizedValue();
    });
    expect(freq).toBeGreaterThan(0);
    expect(freq).toBeLessThan(1320); // maxFrequency * 1.5 approx
  });
});
