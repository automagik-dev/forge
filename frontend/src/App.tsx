import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { Projects } from '@/pages/projects';
import { ProjectTasks } from '@/pages/project-tasks';
import { FullAttemptLogsPage } from '@/pages/full-attempt-logs';
import ReleaseNotesPage from '@/pages/release-notes';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Footer } from '@/components/layout/Footer';
import { usePostHog } from 'posthog-js/react';
import type { SessionStartedEvent, SessionEndedEvent, HeartbeatEvent } from '@/types/analytics';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useNamestexerSessionTracking } from '@/hooks/useNamestexerSessionTracking';

import {
  AgentSettings,
  GeneralSettings,
  McpSettings,
  ProjectSettings,
  SettingsLayout,
} from '@/pages/settings/';
import {
  UserSystemProvider,
  useUserSystem,
} from '@/components/config-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { SearchProvider } from '@/contexts/search-context';

import { HotkeysProvider } from 'react-hotkeys-hook';

import { ProjectProvider } from '@/contexts/project-context';
import { ThemeMode } from 'shared/types';
import * as Sentry from '@sentry/react';
import { Loader } from '@/components/ui/loader';

import NiceModal from '@ebay/nice-modal-react';
import { OnboardingResult } from '@/components/dialogs/global/OnboardingDialog';
import { ClickedElementsProvider } from '@/contexts/ClickedElementsProvider';
import { GenieMasterWidget } from '@/components/genie-widgets/GenieMasterWidget';
import { SubGenieProvider } from '@/context/SubGenieContext';
import { useIsMobile } from '@/components/mobile/MobileLayout';

const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

function AppContent() {
  const [isGenieOpen, setIsGenieOpen] = useState(false);
  const isMobile = useIsMobile();
  const { config, analyticsUserId, updateAndSaveConfig, loading } =
    useUserSystem();
  const posthog = usePostHog();
  const sessionStartTimeRef = useRef<number>(Date.now());
  const heartbeatIntervalRef = useRef<number | null>(null);
  const eventCountRef = useRef<number>(0);

  // Track page navigation
  usePageTracking();

  // Track namastexer sessions (@namastex.ai only, no-op for others)
  useNamestexerSessionTracking();

  // Handle opt-in/opt-out and user identification when config loads
  useEffect(() => {
    if (!posthog || !analyticsUserId) return;

    const userOptedIn = config?.analytics_enabled !== false;
    const isNamestexer = config?.github?.primary_email?.endsWith('@namastex.ai');
    const contactEmailOptIn = config?.contact_email_opt_in === true;
    const contactUsernameOptIn = config?.contact_username_opt_in === true;

    if (userOptedIn) {
      posthog.opt_in_capturing();

      // Build properties object based on consent
      const identifyProperties: Record<string, any> = {};

      if (isNamestexer) {
        // Full tracking for namastexers (mandatory)
        identifyProperties.email = config?.github?.primary_email;
        identifyProperties.username = config?.github?.username;
        identifyProperties.tracking_tier = 'namastexer';
      } else {
        // External users - only include what they consented to
        if (contactEmailOptIn && config?.github?.primary_email) {
          identifyProperties.contact_email = config.github.primary_email;
        }
        if (contactUsernameOptIn && config?.github?.username) {
          identifyProperties.contact_username = config.github.username;
        }
        identifyProperties.tracking_tier =
          contactEmailOptIn || contactUsernameOptIn ? 'community_contact' : 'community_anonymous';
      }

      posthog.identify(analyticsUserId, identifyProperties);
      console.log('[Analytics] Analytics enabled and user identified');
    } else {
      posthog.opt_out_capturing();
      console.log('[Analytics] Analytics disabled by user preference');
    }
  }, [config?.analytics_enabled, config?.contact_email_opt_in, config?.contact_username_opt_in, config?.github?.primary_email, config?.github?.username, analyticsUserId, posthog]);

  // Session tracking: session_started, session_ended, and heartbeat
  useEffect(() => {
    if (!posthog || !analyticsUserId || config?.analytics_enabled === false) return;

    // Capture session_started event
    const lastSessionTime = localStorage.getItem('last_session_time');
    const totalSessions = parseInt(localStorage.getItem('total_sessions') || '0', 10);
    const now = Date.now();

    let daysSinceLastSession: number | null = null;
    if (lastSessionTime) {
      const lastTime = parseInt(lastSessionTime, 10);
      daysSinceLastSession = Math.floor((now - lastTime) / (1000 * 60 * 60 * 24));
    }

    const sessionStartedEvent: SessionStartedEvent = {
      is_returning_user: totalSessions > 0,
      days_since_last_session: daysSinceLastSession,
      total_sessions: totalSessions + 1,
    };

    posthog.capture('session_started', sessionStartedEvent);
    console.log('[Analytics] session_started', sessionStartedEvent);

    // Update localStorage
    localStorage.setItem('last_session_time', now.toString());
    localStorage.setItem('total_sessions', (totalSessions + 1).toString());
    sessionStartTimeRef.current = now;
    eventCountRef.current = 1; // session_started counts as 1 event

    // Start heartbeat (every 30s for concurrent user tracking)
    heartbeatIntervalRef.current = setInterval(() => {
      const heartbeatEvent: HeartbeatEvent = { active: true };
      posthog.capture('$heartbeat', heartbeatEvent);
      eventCountRef.current += 1;
    }, 30000); // 30 seconds

    // Cleanup: session_ended on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      const sessionDuration = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
      const sessionEndedEvent: SessionEndedEvent = {
        session_duration_seconds: sessionDuration,
        events_captured_count: eventCountRef.current,
      };

      posthog.capture('session_ended', sessionEndedEvent);
      console.log('[Analytics] session_ended', sessionEndedEvent);
    };
  }, [posthog, analyticsUserId, config?.analytics_enabled]);

  // Track if onboarding has been initiated in this session to prevent re-triggering
  const onboardingInitiatedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // DEV FLAG: Force show onboarding dialogs for testing
    // Set VITE_FORCE_ONBOARDING=true in your environment to test onboarding flow
    const forceOnboarding = import.meta.env.VITE_FORCE_ONBOARDING === 'true';

    const handleOnboardingComplete = async (
      onboardingConfig: OnboardingResult
    ) => {
      // Don't check cancelled here - we must save once the user completes the flow
      await updateAndSaveConfig({
        onboarding_acknowledged: true,
        executor_profile: onboardingConfig.profile,
        editor: onboardingConfig.editor,
      });
    };

    const handleDisclaimerAccept = async () => {
      // Don't check cancelled here - we must save once the user clicks the button
      await updateAndSaveConfig({ disclaimer_acknowledged: true });
    };

    const handleGitHubLoginComplete = async () => {
      // Don't check cancelled here - we must save once the user completes the flow
      await updateAndSaveConfig({ github_login_acknowledged: true });
    };

    const handleTelemetryOptIn = async (privacySettings: {
      analytics_enabled: boolean;
      contact_email_opt_in: boolean;
      contact_username_opt_in: boolean;
    }) => {
      // Don't check cancelled here - we must save once the user completes the flow
      await updateAndSaveConfig({
        telemetry_acknowledged: true,
        analytics_enabled: privacySettings.analytics_enabled,
        contact_email_opt_in: privacySettings.contact_email_opt_in,
        contact_username_opt_in: privacySettings.contact_username_opt_in,
      });
    };

    const handleReleaseNotesClose = async () => {
      // Don't check cancelled here - we must save once the user closes the dialog
      await updateAndSaveConfig({ show_release_notes: false });
    };

    const checkOnboardingSteps = async () => {
      if (!config || cancelled) return;

      // Prevent re-running onboarding if already initiated in this session
      if (onboardingInitiatedRef.current) return;
      onboardingInitiatedRef.current = true;

      if (!config.disclaimer_acknowledged || forceOnboarding) {
        await NiceModal.show('disclaimer');
        await handleDisclaimerAccept();
      }

      if (!config.onboarding_acknowledged || forceOnboarding) {
        const onboardingResult: OnboardingResult =
          await NiceModal.show('onboarding');
        await handleOnboardingComplete(onboardingResult);
      }

      if (!config.github_login_acknowledged || forceOnboarding) {
        await NiceModal.show('github-login');
        await handleGitHubLoginComplete();
      }

      if (!config.telemetry_acknowledged || forceOnboarding) {
        const privacySettings: {
          analytics_enabled: boolean;
          contact_email_opt_in: boolean;
          contact_username_opt_in: boolean;
        } = await NiceModal.show('privacy-opt-in');
        await handleTelemetryOptIn(privacySettings);
      }

      if (config.show_release_notes) {
        await NiceModal.show('release-notes');
        await handleReleaseNotesClose();
      }
    };

    // Run onboarding flow
    // Note: We use an async IIFE pattern here to properly handle the async operation
    // while still allowing the effect cleanup to set the cancelled flag
    (async () => {
      if (!config || cancelled) return;
      await checkOnboardingSteps();
    })();

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
        <SearchProvider>
          <div className="h-screen flex flex-col bg-background">
            <SentryRoutes>
              {/* VS Code full-page logs route (outside ResponsiveLayout for minimal UI) */}
              <Route
                path="/projects/:projectId/tasks/:taskId/attempts/:attemptId/full"
                element={<FullAttemptLogsPage />}
              />

              <Route element={<ResponsiveLayout />}>
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
                  <Route path="projects" element={<ProjectSettings />} />
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
            <Footer />
          </div>
          {/* Hide GenieMasterWidget in mobile view - use bottom nav Genie button instead */}
          {!isMobile && (
            <GenieMasterWidget
              isOpen={isGenieOpen}
              onToggle={() => setIsGenieOpen(!isGenieOpen)}
              onClose={() => setIsGenieOpen(false)}
            />
          )}
        </SearchProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

// FORGE CUSTOMIZATION: Root provider stack with SubGenie context for Genie Widgets.
// SubGenieProvider wraps NiceModal so Genie chat widgets can show modals.
function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <UserSystemProvider>
        <ClickedElementsProvider>
          <ProjectProvider>
            {/* Keep 'global' active at all times so the hotkeys scope stack is never empty */}
            <HotkeysProvider initiallyActiveScopes={['global', 'kanban', 'dialog', 'projects', 'settings', 'edit-comment', 'approvals', 'follow-up', 'follow-up-ready']}>
              <SubGenieProvider>
                <NiceModal.Provider>
                  <AppContent />
                </NiceModal.Provider>
              </SubGenieProvider>
            </HotkeysProvider>
          </ProjectProvider>
        </ClickedElementsProvider>
      </UserSystemProvider>
    </BrowserRouter>
  );
}

export default App;
