const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
    permissions: ['notifications'],
  },
  webServer: {
    command: 'npx serve -p 3000 .',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
