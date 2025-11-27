export const COMPANION_INSTALL_TASK_TITLE =
  'Install and integrate Automagik Forge Web Companion';

export const COMPANION_INSTALL_TASK_DESCRIPTION = `Goal: Install and integrate the forge-inspector so it renders at the app root in development.

Do:
1) Detect package manager from lockfiles and use it:
   - pnpm-lock.yaml → pnpm add forge-inspector
   - yarn.lock → yarn add forge-inspector
   - package-lock.json → npm i forge-inspector
   - bun.lockb → bun add forge-inspector
   If already listed in package.json dependencies, skip install.

2) Detect framework and app entry:
   - Next.js (pages router): pages/_app.(tsx|js)
   - Next.js (app router): app/layout.(tsx|js) or an app/providers.(tsx|js)
   - Vite/CRA: src/main.(tsx|jsx|ts|js) and src/App.(tsx|jsx|ts|js)
   - Monorepo: operate in the correct package for the web app.
   Confirm by reading package.json and directory structure.

3) Integrate the component:
   import { ForgeInspector as AutomagikForgeWebCompanion } from 'forge-inspector';
   - Vite/CRA: render <AutomagikForgeWebCompanion /> at the app root.
   - Next.js (pages): render in pages/_app.*
   - Next.js (app): render in app/layout.* or a client providers component.
   - For Next.js, if SSR issues arise, use dynamic import with ssr: false.

4) Verify:
   - Type-check, lint/format if configured.
   - Ensure it compiles and renders without SSR/hydration errors.

5) (Optional) Visual Agent Integration for iframe-based preview panels:
   If this app hosts forge-inspector in an iframe (e.g., a preview panel), add parent-side
   integration to receive visual agent observations, reports, and confirmation requests:

   a) Import the utilities:
      import { VisualAgentOverlay, useVisualAgentListener, createVisualAgentListener } from 'forge-inspector';

   b) Choose an integration approach:

      - Drop-in component (easiest):
        Render <VisualAgentOverlay onReport={handleReport} /> alongside your iframe.
        It handles recording indicator, observations panel, and confirmation dialogs.

      - React hook (custom UI):
        const { isRecording, observations, report, pendingConfirm, confirmResponse } = useVisualAgentListener({
          onQAReport: (payload) => console.log('QA Report:', payload),
        });
        Build your own UI using the state and confirmResponse callback.

      - Vanilla JS (non-React):
        const listener = createVisualAgentListener({
          onRecordingStarted: () => showRecordingIndicator(),
          onRecordingObservation: (obs) => addToObservationsList(obs),
          onQAReport: (report) => displayReport(report),
          onConfirmStep: (payload, respond) => {
            showConfirmDialog(payload.question, (confirmed) => respond(confirmed));
          }
        });
        listener.start();

   c) Message types from visual agent:
      - recording-started: Visual agent began recording
      - recording-observation: An observation was made (with timestamp)
      - qa-report: Final QA report with all observations and summary
      - recording-error: An error occurred during recording
      - confirm-step: Agent requests user confirmation before proceeding

Acceptance:
- forge-inspector is installed in the correct package.
- The component is rendered once at the app root without SSR/hydration errors.
- Build/type-check passes.
- (If applicable) Parent app can receive visual agent messages from iframe.`;
