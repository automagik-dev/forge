import { defineConfig } from "cypress";
import path from "path";

export default defineConfig({
  projectId: "85rhk2",

  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    videosFolder: "cypress/videos",
    screenshotsFolder: "cypress/screenshots",
    fixturesFolder: "cypress/fixtures",
    viewportWidth: 393,
    viewportHeight: 852,
    video: true,
    screenshotOnRunFailure: true,
    chromeWebSecurity: false,
    setupNodeEvents(on, config) {},
  },

  env: {
    viewports: {
      "iphone-se": { width: 375, height: 667 },
      "iphone-14-pro": { width: 393, height: 852 },
      "pixel-7": { width: 412, height: 915 },
      "ipad-mini": { width: 768, height: 1024 },
    },
  },

  retries: {
    runMode: 2,
    openMode: 0,
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
      viteConfig: path.resolve(__dirname, "frontend/vite.config.ts"),
    },
  },
});
