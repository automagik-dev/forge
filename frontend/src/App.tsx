import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { Projects } from '@/pages/projects';
import { ProjectTasks } from '@/pages/project-tasks';
import ReleaseNotesPage from '@/pages/release-notes';
import { NormalLayout } from '@/components/layout/NormalLayout';
import { Footer } from '@/components/layout/Footer';
import { usePostHog } from 'posthog-js/react';

import {
  AgentSettings,
  GeneralSettings,
  McpSettings,
  SettingsLayout,
} from '@/pages/settings/';
import {
  useUserSystem,
  UserSystemProvider,
} from '@/components/config-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { SearchProvider } from '@/contexts/search-context';

import { ShortcutsHelp } from '@/components/shortcuts-help';

import { ProjectProvider } from '@/contexts/project-context';
import { ThemeMode } from 'shared/types';
import * as Sentry from '@sentry/react';
import { Loader } from '@/components/ui/loader';

import { AppWithStyleOverride } from '@/utils/style-override';
import { WebviewContextMenu } from '@/vscode/ContextMenu';
import NiceModal from '@ebay/nice-modal-react';
import { OnboardingResult } from '@/components/dialogs/global/OnboardingDialog';
import { ClickedElementsProvider } from '@/contexts/ClickedElementsProvider';
import { GenieMasterWidget } from '@/components/genie-widgets/GenieMasterWidget';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { KeyboardShortcutsProvider } from '@/contexts/keyboard-shortcuts-context';
import { SubGenieProvider } from '@/context/SubGenieContext';
import { AuthGate } from '@/components/auth/AuthGate';

const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

function AppContent() {
  const [isGenieOpen, setIsGenieOpen] = useState(false);
  const { config, analyticsUserId, updateAndSaveConfig, loading } =
    useUserSystem();
  const posthog = usePostHog();

  // Handle opt-in/opt-out and user identification when config loads
  useEffect(() => {
    if (!posthog || !analyticsUserId) return;

    const userOptedIn = config?.analytics_enabled !== false;

    if (userOptedIn) {
      posthog.opt_in_capturing();
      posthog.identify(analyticsUserId);
      console.log('[Analytics] Analytics enabled and user identified');
    } else {
      posthog.opt_out_capturing();
      console.log('[Analytics] Analytics disabled by user preference');
    }
  }, [config?.analytics_enabled, analyticsUserId, posthog]);

  useEffect(() => {
    let cancelled = false;

    const handleOnboardingComplete = async (
      onboardingConfig: OnboardingResult
    ) => {
      if (cancelled) return;
      const updatedConfig = {
        ...config,
        onboarding_acknowledged: true,
        executor_profile: onboardingConfig.profile,
        editor: onboardingConfig.editor,
      };

      updateAndSaveConfig(updatedConfig);
    };

    const handleDisclaimerAccept = async () => {
      if (cancelled) return;
      await updateAndSaveConfig({ disclaimer_acknowledged: true });
    };

    const handleGitHubLoginComplete = async () => {
      if (cancelled) return;
      await updateAndSaveConfig({ github_login_acknowledged: true });
    };

    const handleTelemetryOptIn = async (analyticsEnabled: boolean) => {
      if (cancelled) return;
      await updateAndSaveConfig({
        telemetry_acknowledged: true,
        analytics_enabled: analyticsEnabled,
      });
    };

    const handleReleaseNotesClose = async () => {
      if (cancelled) return;
      await updateAndSaveConfig({ show_release_notes: false });
    };

    const checkOnboardingSteps = async () => {
      if (!config || cancelled) return;

      if (!config.disclaimer_acknowledged) {
        await NiceModal.show('disclaimer');
        await handleDisclaimerAccept();
        await NiceModal.hide('disclaimer');
      }

      if (!config.onboarding_acknowledged) {
        const onboardingResult: OnboardingResult =
          await NiceModal.show('onboarding');
        await handleOnboardingComplete(onboardingResult);
        await NiceModal.hide('onboarding');
      }

      if (!config.github_login_acknowledged) {
        await NiceModal.show('github-login');
        await handleGitHubLoginComplete();
        await NiceModal.hide('github-login');
      }

      if (!config.telemetry_acknowledged) {
        const analyticsEnabled: boolean =
          await NiceModal.show('privacy-opt-in');
        await handleTelemetryOptIn(analyticsEnabled);
        await NiceModal.hide('privacy-opt-in');
      }

      if (config.show_release_notes) {
        await NiceModal.show('release-notes');
        await handleReleaseNotesClose();
        await NiceModal.hide('release-notes');
      }
    };

    const runOnboarding = async () => {
      if (!config || cancelled) return;
      await checkOnboardingSteps();
    };

    runOnboarding();

    return () => {
      cancelled = true;
    };
  }, [config, updateAndSaveConfig]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader message="Loading..." size={32} />
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider initialTheme={config?.theme || ThemeMode.SYSTEM}>
        <AppWithStyleOverride>
          <SearchProvider>
            <div className="h-screen flex flex-col bg-background">
              <WebviewContextMenu />

              <div className="flex-1 min-h-0 flex flex-col">
                <SentryRoutes>
                  <Route element={<NormalLayout />}>
                    <Route path="/" element={<Projects />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:projectId" element={<Projects />} />
                    <Route
                      path="/projects/:projectId/tasks"
                      element={<ProjectTasks />}
                    />
                    <Route path="/settings/*" element={<SettingsLayout />}>
                      <Route index element={<Navigate to="general" replace />} />
                      <Route path="general" element={<GeneralSettings />} />
                      <Route path="agents" element={<AgentSettings />} />
                      <Route path="mcp" element={<McpSettings />} />
                    </Route>
                    <Route
                      path="/mcp-servers"
                      element={<Navigate to="/settings/mcp" replace />}
                    />
                    <Route
                      path="/release-notes"
                      element={<ReleaseNotesPage />}
                    />
                    <Route
                      path="/projects/:projectId/tasks/:taskId"
                      element={<ProjectTasks />}
                    />
                    <Route
                      path="/projects/:projectId/tasks/:taskId/attempts/:attemptId"
                      element={<ProjectTasks />}
                    />
                  </Route>
                </SentryRoutes>
              </div>

              <Footer />
            </div>
            <ShortcutsHelp />
            <GenieMasterWidget
              isOpen={isGenieOpen}
              onToggle={() => setIsGenieOpen(!isGenieOpen)}
              onClose={() => setIsGenieOpen(false)}
            />
          </SearchProvider>
        </AppWithStyleOverride>
      </ThemeProvider>
    </I18nextProvider>
  );
}

// FORGE CUSTOMIZATION: Root provider stack lives here so BrowserRouter wraps
// UserSystem, NiceModal, AuthGate, keyboard scopes, and SubGenie contexts.
// This keeps modals and widgets in sync with routing and authentication state.
// NOTE: NiceModal.Provider must be OUTSIDE AuthGate so modals can be shown
// even when AuthGate is blocking access (e.g., login dialog).
function App() {
  return (
    <BrowserRouter>
      <UserSystemProvider>
        <ClickedElementsProvider>
          <ProjectProvider>
            <HotkeysProvider initiallyActiveScopes={['*', 'global', 'kanban']}>
              <KeyboardShortcutsProvider>
                <SubGenieProvider>
                  <NiceModal.Provider>
                    <AuthGate>
                      <AppContent />
                    </AuthGate>
                  </NiceModal.Provider>
                </SubGenieProvider>
              </KeyboardShortcutsProvider>
            </HotkeysProvider>
          </ProjectProvider>
        </ClickedElementsProvider>
      </UserSystemProvider>
    </BrowserRouter>
  );
}

export default App;
