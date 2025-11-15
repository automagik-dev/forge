import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/index.css';
import { ClickToComponent } from 'click-to-react-component';
import { ForgeInspector as AutomagikForgeWebCompanion } from 'forge-inspector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import NiceModal from '@ebay/nice-modal-react';
import i18n from './i18n';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
// Import modal type definitions
import './types/modals';
// Import and register modals
import {
  GitHubLoginDialog,
  CreatePRDialog,
  ConfirmDialog,
  DisclaimerDialog,
  OnboardingDialog,
  PrivacyOptInDialog,
  ProvidePatDialog,
  ReleaseNotesDialog,
  TaskFormDialog,
  EditorSelectionDialog,
  DeleteTaskConfirmationDialog,
  ArchiveTaskConfirmationDialog,
  FolderPickerDialog,
  TagEditDialog,
  ChangeTargetBranchDialog,
  RebaseDialog,
  CreateConfigurationDialog,
  DeleteConfigurationDialog,
  ProjectFormDialog,
  ProjectEditorSelectionDialog,
  RestoreLogsDialog,
  ViewProcessesDialog,
  GitActionsDialog,
} from './components/dialogs';
import { CreateAttemptDialog } from './components/dialogs/tasks/CreateAttemptDialog';

// Register modals
NiceModal.register('github-login', GitHubLoginDialog);
NiceModal.register('create-pr', CreatePRDialog);
NiceModal.register('confirm', ConfirmDialog);
NiceModal.register('disclaimer', DisclaimerDialog);
NiceModal.register('onboarding', OnboardingDialog);
NiceModal.register('privacy-opt-in', PrivacyOptInDialog);
NiceModal.register('provide-pat', ProvidePatDialog);
NiceModal.register('release-notes', ReleaseNotesDialog);
NiceModal.register('delete-task-confirmation', DeleteTaskConfirmationDialog);
NiceModal.register('archive-task-confirmation', ArchiveTaskConfirmationDialog);
NiceModal.register('task-form', TaskFormDialog);
NiceModal.register('editor-selection', EditorSelectionDialog);
NiceModal.register('folder-picker', FolderPickerDialog);
NiceModal.register('tag-edit', TagEditDialog);
NiceModal.register('change-target-branch-dialog', ChangeTargetBranchDialog);
NiceModal.register('rebase-dialog', RebaseDialog);
NiceModal.register('create-configuration', CreateConfigurationDialog);
NiceModal.register('delete-configuration', DeleteConfigurationDialog);
NiceModal.register('project-form', ProjectFormDialog);
NiceModal.register('project-editor-selection', ProjectEditorSelectionDialog);
NiceModal.register('restore-logs', RestoreLogsDialog);
NiceModal.register('view-processes', ViewProcessesDialog);
NiceModal.register('create-attempt', CreateAttemptDialog);
NiceModal.register('git-actions', GitActionsDialog);

import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';

Sentry.init({
  dsn: 'https://1065a1d276a581316999a07d5dffee26@o4509603705192449.ingest.de.sentry.io/4509605576441937',
  tracesSampleRate: 1.0,
  environment: import.meta.env.MODE === 'development' ? 'dev' : 'production',
  integrations: [
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
  ],
});
Sentry.setTag('source', 'frontend');

// PostHog configuration
// SECURITY NOTE: This is a Project API Key (phc_*), which is write-only and designed
// for client-side use. It can ONLY send events to PostHog, not read data or modify
// project settings. This is standard practice for client-side analytics tools
// (like Google Analytics, Mixpanel, etc.) - the key is visible in the JS bundle anyway.
// Always embedded in code for consistent behavior across all build methods.
const posthogKey = 'phc_' + 'KYI6y57aVECNO9aj5O28gNAz3r7BU0cTtEf50HQJZHd';
const posthogHost = 'https://us.i.posthog.com';

if (posthogKey && posthogHost) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: false,
    capture_pageleave: true,
    capture_performance: true, // Keep for performance monitoring (disclosed in dialog)
    autocapture: false,
    enable_heatmaps: true, // Enable aggregate UX insights (mouse movement, clicks, scrolling)
    opt_out_capturing_by_default: true,
    mask_all_text: true, // Masks any text in error messages
    sanitize_properties: (properties) => {
      // Don't sanitize for namastexers (detected later via email)
      if (properties?.tracking_tier === 'namastexer') {
        return properties;
      }

      // Remove any PII that might slip through for non-namastexers
      const sanitized = { ...properties };

      // Remove direct PII fields
      const piiFields = ['email', 'username', 'ip', 'name', '$ip'];
      piiFields.forEach(field => {
        delete sanitized[field];
        // Also remove nested fields like $set.email
        if (sanitized.$set) {
          delete sanitized.$set[field];
        }
      });

      // Keep contact fields if explicitly opted in
      if (properties?.tracking_tier === 'community_contact') {
        // These are allowed when user consents
        // contact_email and contact_username are kept
      } else {
        // Remove contact fields if no consent
        delete sanitized.contact_email;
        delete sanitized.contact_username;
      }

      return sanitized;
    },
  });
} else {
  console.warn(
    'PostHog API key or endpoint not set. Analytics will be disabled.'
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <PostHogProvider client={posthog}>
        <Sentry.ErrorBoundary
          fallback={<p>{i18n.t('common:states.error')}</p>}
          showDialog
        >
          <ClickToComponent />
          <AutomagikForgeWebCompanion />
          <App />
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </Sentry.ErrorBoundary>
      </PostHogProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
