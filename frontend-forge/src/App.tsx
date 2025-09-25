import { useEffect, useMemo, useState } from 'react';
import type {
  BranchNameResponse,
  ForgeProjectSettings,
  OmniConfig,
  OmniInstance,
  RecipientType,
} from '../../shared/forge-types';

interface HealthResponse {
  status: string;
  service: string;
  message: string;
}

export {
  statusTone,
  formatTimestamp,
  omniConfigFor,
  normaliseConfigDraft,
  toastToneColor,
  omniConfigErrors,
  describeOmniField,
};

interface BranchTemplateEnvelope {
  task_id: string;
  project_id: string;
  branch_template: string | null;
  enabled: boolean;
}

type ToastTone = 'success' | 'error' | 'info';
interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

interface OmniNotification {
  id: string;
  task_id: string | null;
  notification_type: string;
  status: string;
  message: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  metadata?: unknown;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const SAMPLE_TASK_ID = import.meta.env.VITE_SAMPLE_TASK_ID ?? '';
const RECIPIENT_TYPES: RecipientType[] = ['PhoneNumber', 'UserId'];

const randomId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const statusTone = (status: string): ToastTone => {
  switch (status.toLowerCase()) {
    case 'sent':
      return 'success';
    case 'failed':
      return 'error';
    default:
      return 'info';
  }
};

const formatTimestamp = (value: string | null | undefined) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
};

const EMPTY_OMNI_CONFIG: OmniConfig = {
  enabled: false,
  host: null,
  api_key: null,
  instance: null,
  recipient: null,
  recipient_type: null,
};

function cloneSettings(settings: ForgeProjectSettings): ForgeProjectSettings {
  return JSON.parse(JSON.stringify(settings));
}

async function requestJson<T>(method: HttpMethod, url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function fetchJson<T>(url: string): Promise<T> {
  return requestJson<T>('GET', url);
}

function omniConfigFor(settings: ForgeProjectSettings): OmniConfig {
  return {
    ...EMPTY_OMNI_CONFIG,
    ...(settings.omni_config ?? {}),
    enabled: settings.omni_enabled,
  };
}

function normaliseConfigDraft(settings: ForgeProjectSettings): ForgeProjectSettings {
  const draft = cloneSettings(settings);
  draft.omni_config = omniConfigFor(settings);
  return draft;
}

function omniConfigErrors(config: OmniConfig): string[] {
  if (!config.enabled) {
    return [];
  }

  const errors: string[] = [];

  if (!config.host || !config.host.trim()) {
    errors.push('host');
  }

  if (!config.instance || !config.instance.trim()) {
    errors.push('instance');
  }

  if (!config.recipient || !config.recipient.trim()) {
    errors.push('recipient');
  }

  return errors;
}

function describeOmniField(field: string): string {
  switch (field) {
    case 'host':
      return 'Host URL';
    case 'instance':
      return 'Instance name';
    case 'recipient':
      return 'Recipient contact';
    default:
      return field;
  }
}

function toastToneColor(tone: ToastTone): string {
  switch (tone) {
    case 'success':
      return '#9ef29b';
    case 'error':
      return '#ff7b8a';
    default:
      return '#c2c8f5';
  }
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [globalSettings, setGlobalSettings] = useState<ForgeProjectSettings | null>(null);
  const [globalDraft, setGlobalDraft] = useState<ForgeProjectSettings | null>(null);
  const [projectId, setProjectId] = useState('');
  const [projectSettings, setProjectSettings] = useState<ForgeProjectSettings | null>(null);
  const [projectDraft, setProjectDraft] = useState<ForgeProjectSettings | null>(null);
  const [branchTaskId, setBranchTaskId] = useState(SAMPLE_TASK_ID);
  const [branchEnvelope, setBranchEnvelope] = useState<BranchTemplateEnvelope | null>(null);
  const [branchDraft, setBranchDraft] = useState('');
  const [generatedBranch, setGeneratedBranch] = useState<BranchNameResponse | null>(null);
  const [omniInstances, setOmniInstances] = useState<OmniInstance[]>([]);
  const [omniNotifications, setOmniNotifications] = useState<OmniNotification[]>([]);
  const [messages, setMessages] = useState<Toast[]>([]);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false);
  const [isGeneratingBranch, setIsGeneratingBranch] = useState(false);

  function pushToast(message: string, tone: ToastTone = 'info') {
    setMessages((prev) => [{ id: randomId(), tone, message }, ...prev]);
  }

  useEffect(() => {
    fetchJson<HealthResponse>('/health')
      .then(setHealth)
      .catch((error) => pushToast(`Health check failed: ${error.message}`, 'error'));

    fetchJson<ForgeProjectSettings>('/api/forge/config')
      .then((settings) => {
        setGlobalSettings(settings);
        setGlobalDraft(normaliseConfigDraft(settings));
      })
      .catch((error) => pushToast(`Failed to load global settings: ${error.message}`, 'error'));

    fetchJson<{ instances: OmniInstance[] }>('/api/forge/omni/instances')
      .then((payload) => setOmniInstances(payload.instances || []))
      .catch((error) => pushToast(`Failed to list Omni instances: ${error.message}`, 'error'));

    reloadOmniNotifications();

    if (SAMPLE_TASK_ID) {
      loadBranchTemplate(SAMPLE_TASK_ID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateGlobalDraft(updater: (draft: ForgeProjectSettings) => void) {
    setGlobalDraft((prev) => {
      if (!prev) return prev;
      const draft = { ...prev, omni_config: { ...prev.omni_config } } as ForgeProjectSettings;
      updater(draft);
      return draft;
    });
  }

  function updateProjectDraft(updater: (draft: ForgeProjectSettings) => void) {
    setProjectDraft((prev) => {
      if (!prev) return prev;
      const draft = { ...prev, omni_config: { ...prev.omni_config } } as ForgeProjectSettings;
      updater(draft);
      return draft;
    });
  }

  async function refreshGlobalSettings() {
    try {
      const settings = await fetchJson<ForgeProjectSettings>('/api/forge/config');
      setGlobalSettings(settings);
      setGlobalDraft(normaliseConfigDraft(settings));
      pushToast('Reloaded global settings', 'info');
    } catch (error) {
      pushToast(`Failed to refresh global settings: ${(error as Error).message}`, 'error');
    }
  }

  async function saveGlobalSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!globalDraft) return;

    setIsSavingGlobal(true);
    try {
      const payload: ForgeProjectSettings = {
        ...globalDraft,
        omni_enabled: globalDraft.omni_config?.enabled ?? globalDraft.omni_enabled,
      };
      const saved = await requestJson<ForgeProjectSettings>('PUT', '/api/forge/config', payload);
      setGlobalSettings(saved);
      setGlobalDraft(normaliseConfigDraft(saved));
      pushToast('Global settings updated', 'success');
      await reloadOmniInstances();
      await reloadOmniNotifications();
    } catch (error) {
      pushToast(`Failed to update global settings: ${(error as Error).message}`, 'error');
    } finally {
      setIsSavingGlobal(false);
    }
  }

  async function reloadOmniInstances() {
    try {
      const payload = await fetchJson<{ instances: OmniInstance[] }>('/api/forge/omni/instances');
      setOmniInstances(payload.instances || []);
    } catch (error) {
      pushToast(`Failed to refresh Omni instances: ${(error as Error).message}`, 'error');
    }
  }

  async function reloadOmniNotifications() {
    try {
      const payload = await fetchJson<{ notifications: OmniNotification[] }>(
        '/api/forge/omni/notifications',
      );
      setOmniNotifications(payload.notifications || []);
    } catch (error) {
      pushToast(`Failed to refresh Omni notifications: ${(error as Error).message}`, 'error');
    }
  }

  async function loadProjectSettings(targetId: string) {
    if (!targetId) {
      pushToast('Enter a project ID to load settings', 'error');
      return;
    }
    try {
      const settings = await fetchJson<ForgeProjectSettings>(
        `/api/forge/projects/${targetId}/settings`,
      );
      setProjectSettings(settings);
      setProjectDraft(normaliseConfigDraft(settings));
      pushToast('Loaded project settings', 'info');
    } catch (error) {
      pushToast(`Failed to load project settings: ${(error as Error).message}`, 'error');
    }
  }

  async function saveProjectSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId || !projectDraft) {
      pushToast('Load a project before saving settings', 'error');
      return;
    }

    setIsSavingProject(true);
    try {
      const payload: ForgeProjectSettings = {
        ...projectDraft,
        omni_enabled: projectDraft.omni_config?.enabled ?? projectDraft.omni_enabled,
      };
      const saved = await requestJson<ForgeProjectSettings>(
        'PUT',
        `/api/forge/projects/${projectId}/settings`,
        payload,
      );
      setProjectSettings(saved);
      setProjectDraft(normaliseConfigDraft(saved));
      pushToast('Project settings updated', 'success');
      await reloadOmniNotifications();
    } catch (error) {
      pushToast(`Failed to update project settings: ${(error as Error).message}`, 'error');
    } finally {
      setIsSavingProject(false);
    }
  }

  async function loadBranchTemplate(taskId: string) {
    if (!taskId) return;
    try {
      const envelope = await fetchJson<BranchTemplateEnvelope>(
        `/api/forge/branch-templates/${taskId}`,
      );
      setBranchEnvelope(envelope);
      setBranchDraft(envelope.branch_template ?? '');
    } catch (error) {
      pushToast(`Failed to load branch template: ${(error as Error).message}`, 'error');
    }
  }

  async function updateBranchTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!branchTaskId) {
      pushToast('Enter a task ID to update the template', 'error');
      return;
    }

    setIsUpdatingTemplate(true);
    try {
      const payload = { branch_template: branchDraft.trim() || null };
      const envelope = await requestJson<BranchTemplateEnvelope>(
        'PUT',
        `/api/forge/branch-templates/${branchTaskId}`,
        payload,
      );
      setBranchEnvelope(envelope);
      pushToast('Branch template updated', 'success');
    } catch (error) {
      pushToast(`Failed to update branch template: ${(error as Error).message}`, 'error');
    } finally {
      setIsUpdatingTemplate(false);
    }
  }

  async function generateBranchName() {
    if (!branchTaskId) {
      pushToast('Enter a task ID to generate a branch', 'error');
      return;
    }

    setIsGeneratingBranch(true);
    try {
      const payload = { attempt_id: randomId() };
      const generated = await requestJson<BranchNameResponse>(
        'POST',
        `/api/forge/branch-templates/${branchTaskId}/generate`,
        payload,
      );
      setGeneratedBranch(generated);
      pushToast(`Generated branch ${generated.branch_name}`, 'success');
    } catch (error) {
      pushToast(`Failed to generate branch name: ${(error as Error).message}`, 'error');
    } finally {
      setIsGeneratingBranch(false);
    }
  }

  const globalOmniDraft = useMemo(() => globalDraft?.omni_config ?? EMPTY_OMNI_CONFIG, [globalDraft]);
  const projectOmniDraft = useMemo(
    () => projectDraft?.omni_config ?? EMPTY_OMNI_CONFIG,
    [projectDraft],
  );
  const globalOmniErrors = useMemo(() => omniConfigErrors(globalOmniDraft), [globalOmniDraft]);
  const projectOmniErrors = useMemo(() => omniConfigErrors(projectOmniDraft), [projectOmniDraft]);

  return (
    <main className="container">
      <header>
        <h1>Forge Control Panel</h1>
        <p className="tagline">
          Configure Automagik Forge extensions, monitor Omni connectivity, and manage branch templates
          without touching upstream code. Need the legacy UI?{' '}
          <a href="/legacy" rel="noreferrer">
            Open it here
          </a>
          .
        </p>
      </header>

      {messages.length > 0 && (
        <section className="alerts">
          {messages.map((toast) => (
            <div className="card" key={toast.id} style={{ borderColor: toastToneColor(toast.tone) }}>
              <span className="status-label" data-state={toast.tone} style={{ background: toastToneColor(toast.tone) }}>
                {toast.tone.toUpperCase()}
              </span>
              <p className="message">{toast.message}</p>
            </div>
          ))}
        </section>
      )}

      <section className="status">
        <h2>Backend Status</h2>
        {health ? (
          <div className="card">
            <span className="status-label" data-state={health.status}>
              {health.status.toUpperCase()}
            </span>
            <div>
              <p className="service">{health.service}</p>
              <p className="message">{health.message}</p>
            </div>
          </div>
        ) : (
          <div className="card muted">
            <span className="status-label" data-state="pending">
              PENDING
            </span>
            <div>
              <p className="service">forge-app</p>
              <p className="message">Collecting health metrics…</p>
            </div>
          </div>
        )}
      </section>

      <section className="status">
        <h2>Global Forge Settings</h2>
        <form className="card" onSubmit={saveGlobalSettings}>
          <div className="form-grid">
            <label className="field">
              <span className="label">Branch Templates Enabled</span>
              <input
                type="checkbox"
                checked={globalDraft?.branch_templates_enabled ?? true}
                onChange={(event) =>
                  updateGlobalDraft((draft) => {
                    draft.branch_templates_enabled = event.target.checked;
                  })
                }
              />
            </label>
            <label className="field">
              <span className="label">Omni Notifications Enabled</span>
              <input
                type="checkbox"
                checked={globalOmniDraft.enabled}
                onChange={(event) =>
                  updateGlobalDraft((draft) => {
                    draft.omni_config = { ...omniConfigFor(draft), enabled: event.target.checked };
                    draft.omni_enabled = event.target.checked;
                  })
                }
              />
            </label>
          </div>

          <fieldset className="fieldset">
            <legend>Default Omni Configuration</legend>
            <div className="form-grid">
              <label className="field">
                <span className="label">Host</span>
                <input
                  type="url"
                  placeholder="https://omni.example"
                  value={globalOmniDraft.host ?? ''}
                  onChange={(event) =>
                    updateGlobalDraft((draft) => {
                      draft.omni_config = {
                        ...omniConfigFor(draft),
                        host: event.target.value || null,
                      };
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="label">API Key</span>
                <input
                  type="text"
                  placeholder="sk-..."
                  value={globalOmniDraft.api_key ?? ''}
                  onChange={(event) =>
                    updateGlobalDraft((draft) => {
                      draft.omni_config = {
                        ...omniConfigFor(draft),
                        api_key: event.target.value || null,
                      };
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="label">Instance Name</span>
                <input
                  type="text"
                  value={globalOmniDraft.instance ?? ''}
                  onChange={(event) =>
                    updateGlobalDraft((draft) => {
                      draft.omni_config = {
                        ...omniConfigFor(draft),
                        instance: event.target.value || null,
                      };
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="label">Recipient</span>
                <input
                  type="text"
                  value={globalOmniDraft.recipient ?? ''}
                  onChange={(event) =>
                    updateGlobalDraft((draft) => {
                      draft.omni_config = {
                        ...omniConfigFor(draft),
                        recipient: event.target.value || null,
                      };
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="label">Recipient Type</span>
                <select
                  value={globalOmniDraft.recipient_type ?? ''}
                  onChange={(event) =>
                    updateGlobalDraft((draft) => {
                      draft.omni_config = {
                        ...omniConfigFor(draft),
                        recipient_type: (event.target.value as RecipientType) || null,
                      };
                    })
                  }
                >
                  <option value="">Default</option>
                  {RECIPIENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          {globalOmniDraft.enabled && globalOmniErrors.length > 0 && (
            <div className="meta error">
              <p>Complete these fields before saving Omni notifications:</p>
              <ul>
                {globalOmniErrors.map((field) => (
                  <li key={field}>{describeOmniField(field)}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={isSavingGlobal || globalOmniErrors.length > 0}>
              {isSavingGlobal ? 'Saving…' : 'Save Global Settings'}
            </button>
            <button type="button" onClick={refreshGlobalSettings} disabled={isSavingGlobal}>
              Reload
            </button>
          </div>
        </form>
      </section>

      <section className="status">
        <h2>Project Overrides</h2>
        <div className="card">
          <form className="form-grid" onSubmit={(event) => {
            event.preventDefault();
            loadProjectSettings(projectId.trim());
          }}>
            <label className="field wide">
              <span className="label">Project ID</span>
              <input
                type="text"
                placeholder="UUID"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              />
            </label>
            <div className="form-actions">
              <button type="submit">Load Settings</button>
              <button
                type="button"
                onClick={() => {
                  setProjectSettings(null);
                  setProjectDraft(null);
                }}
              >
                Clear
              </button>
            </div>
          </form>

          {projectDraft ? (
            <form className="project-form" onSubmit={saveProjectSettings}>
              <div className="form-grid">
                <label className="field">
                  <span className="label">Branch Templates Enabled</span>
                  <input
                    type="checkbox"
                    checked={projectDraft.branch_templates_enabled}
                    onChange={(event) =>
                      updateProjectDraft((draft) => {
                        draft.branch_templates_enabled = event.target.checked;
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span className="label">Omni Notifications Enabled</span>
                  <input
                    type="checkbox"
                    checked={projectOmniDraft.enabled}
                    onChange={(event) =>
                      updateProjectDraft((draft) => {
                        draft.omni_config = {
                          ...omniConfigFor(draft),
                          enabled: event.target.checked,
                        };
                        draft.omni_enabled = event.target.checked;
                      })
                    }
                  />
                </label>
              </div>

              <fieldset className="fieldset">
                <legend>Project Omni Overrides</legend>
                <div className="form-grid">
                  <label className="field">
                    <span className="label">Host</span>
                    <input
                      type="url"
                      value={projectOmniDraft.host ?? ''}
                      onChange={(event) =>
                        updateProjectDraft((draft) => {
                          draft.omni_config = {
                            ...omniConfigFor(draft),
                            host: event.target.value || null,
                          };
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    <span className="label">API Key</span>
                    <input
                      type="text"
                      value={projectOmniDraft.api_key ?? ''}
                      onChange={(event) =>
                        updateProjectDraft((draft) => {
                          draft.omni_config = {
                            ...omniConfigFor(draft),
                            api_key: event.target.value || null,
                          };
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    <span className="label">Instance</span>
                    <input
                      type="text"
                      value={projectOmniDraft.instance ?? ''}
                      onChange={(event) =>
                        updateProjectDraft((draft) => {
                          draft.omni_config = {
                            ...omniConfigFor(draft),
                            instance: event.target.value || null,
                          };
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    <span className="label">Recipient</span>
                    <input
                      type="text"
                      value={projectOmniDraft.recipient ?? ''}
                      onChange={(event) =>
                        updateProjectDraft((draft) => {
                          draft.omni_config = {
                            ...omniConfigFor(draft),
                            recipient: event.target.value || null,
                          };
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    <span className="label">Recipient Type</span>
                    <select
                      value={projectOmniDraft.recipient_type ?? ''}
                      onChange={(event) =>
                        updateProjectDraft((draft) => {
                          draft.omni_config = {
                            ...omniConfigFor(draft),
                            recipient_type: (event.target.value as RecipientType) || null,
                          };
                        })
                      }
                    >
                      <option value="">Default</option>
                      {RECIPIENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </fieldset>

              {projectOmniDraft.enabled && projectOmniErrors.length > 0 && (
                <div className="meta error">
                  <p>Project overrides require the following Omni fields:</p>
                  <ul>
                    {projectOmniErrors.map((field) => (
                      <li key={field}>{describeOmniField(field)}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isSavingProject || projectOmniErrors.length > 0}
                >
                  {isSavingProject ? 'Saving…' : 'Save Project Overrides'}
                </button>
              </div>
            </form>
          ) : (
            <p className="meta">Load a project to view overrides.</p>
          )}
        </div>
      </section>

      <section className="status">
        <h2>Branch Template Toolkit</h2>
        <form className="card branch-tool" onSubmit={updateBranchTemplate}>
          <div className="form-grid">
            <label className="field">
              <span className="label">Task ID</span>
              <input
                type="text"
                placeholder="Task UUID"
                value={branchTaskId}
                onChange={(event) => setBranchTaskId(event.target.value)}
                onBlur={(event) => loadBranchTemplate(event.target.value.trim())}
              />
            </label>
            <label className="field">
              <span className="label">Branch Template</span>
              <input
                type="text"
                placeholder="feature-login"
                value={branchDraft}
                onChange={(event) => setBranchDraft(event.target.value)}
                disabled={!branchEnvelope?.enabled}
              />
            </label>
          </div>

          <div className="meta">
            {branchEnvelope ? (
              <span>
                Project: {branchEnvelope.project_id} · Feature flag:{' '}
                {branchEnvelope.enabled ? 'ENABLED' : 'DISABLED'}
              </span>
            ) : (
              <span>Load a task to view its template metadata.</span>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" disabled={isUpdatingTemplate}>
              {isUpdatingTemplate ? 'Saving…' : 'Save Template'}
            </button>
            <button type="button" onClick={() => loadBranchTemplate(branchTaskId)}>
              Reload
            </button>
            <button type="button" onClick={() => generateBranchName()} disabled={isGeneratingBranch}>
              {isGeneratingBranch ? 'Generating…' : 'Generate Branch Name'}
            </button>
          </div>

          {generatedBranch && (
            <div className="card muted">
              <span className="status-label" data-state="ok">
                RESULT
              </span>
              <div>
                <p className="label">Generated Branch</p>
                <p className="value">{generatedBranch.branch_name}</p>
                <p className="meta">Attempt {generatedBranch.attempt_id}</p>
              </div>
            </div>
          )}
        </form>
      </section>

      <section className="status">
        <h2>Omni Instances</h2>
        <div className="card">
          {omniInstances.length > 0 ? (
            <div className="instance-grid">
              {omniInstances.map((instance) => (
                <div className="card" key={instance.instance_name}>
                  <span
                    className="status-label"
                    data-state={instance.is_healthy ? 'ok' : 'warning'}
                    style={{ background: instance.is_healthy ? '#9ef29b' : '#fdd965' }}
                  >
                    {instance.is_healthy ? 'HEALTHY' : 'ISSUE'}
                  </span>
                  <div>
                    <p className="service">{instance.display_name}</p>
                    <p className="message">
                      {instance.channel_type} · {instance.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="meta">
              No Omni instances reported. Ensure the Omni service credentials are configured above.
            </p>
          )}
        </div>
      </section>

      <section className="status">
        <h2>Recent Omni Notifications</h2>
        <div className="card notifications">
          <div className="form-actions">
            <button type="button" onClick={() => reloadOmniNotifications()}>
              Refresh
            </button>
          </div>
          {omniNotifications.length > 0 ? (
            <div className="notification-list">
              {omniNotifications.map((notification) => (
                <div className="notification-entry" key={notification.id}>
                  <span
                    className="status-label"
                    data-state={statusTone(notification.status)}
                    style={{ background: toastToneColor(statusTone(notification.status)) }}
                  >
                    {notification.status.toUpperCase()}
                  </span>
                  <div>
                    <p className="service">{notification.notification_type}</p>
                    <p className="message">
                      {notification.message ?? notification.error_message ?? 'No message recorded.'}
                    </p>
                    <p className="meta">
                      Created {formatTimestamp(notification.created_at)} · Sent{' '}
                      {formatTimestamp(notification.sent_at)}
                    </p>
                    {notification.task_id && (
                      <p className="meta">task: {notification.task_id}</p>
                    )}
                    {notification.error_message && (
                      <p className="meta">error: {notification.error_message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="meta">No Omni notifications recorded yet.</p>
          )}
        </div>
      </section>

      <footer>
        <p>
          Looking for more? Legacy Automagik UI remains available under <code>/legacy</code>. All new forge
          features should be managed from this panel so upstream stays untouched.
        </p>
      </footer>
    </main>
  );
}
