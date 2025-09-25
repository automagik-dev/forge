import { useEffect, useMemo, useState } from 'react';

type HealthResponse = {
  status: string;
  service: string;
  message: string;
};

type OmniConfig = {
  enabled: boolean;
  host: string | null;
  api_key: string | null;
  instance: string | null;
  recipient: string | null;
  recipient_type: string | null;
};

type ForgeProjectSettings = {
  omni_enabled: boolean;
  omni_config: OmniConfig | null;
  branch_templates_enabled: boolean;
};

type BranchTemplateResponse = {
  task_id: string;
  project_id: string;
  branch_template: string | null;
  enabled: boolean;
};

type ForgeSummary = {
  health?: HealthResponse;
  globalSettings?: ForgeProjectSettings;
  branchTemplate?: BranchTemplateResponse;
};

const SAMPLE_TASK_ID = import.meta.env.VITE_SAMPLE_TASK_ID ?? '';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export default function App() {
  const [summary, setSummary] = useState<ForgeSummary>({});
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const errBucket: string[] = [];

    async function hydrate() {
      try {
        const health = await fetchJson<HealthResponse>('/health');
        setSummary((prev) => ({ ...prev, health }));
      } catch (error) {
        errBucket.push(`Health check failed: ${(error as Error).message}`);
      }

      try {
        const settings = await fetchJson<ForgeProjectSettings>('/api/forge/config');
        setSummary((prev) => ({ ...prev, globalSettings: settings }));
      } catch (error) {
        errBucket.push(`Config fetch failed: ${(error as Error).message}`);
      }

      if (SAMPLE_TASK_ID) {
        try {
          const branchTemplate = await fetchJson<BranchTemplateResponse>(
            `/api/forge/branch-templates/${SAMPLE_TASK_ID}`,
          );
          setSummary((prev) => ({ ...prev, branchTemplate }));
        } catch (error) {
          errBucket.push(`Branch template request failed: ${(error as Error).message}`);
        }
      }

      if (errBucket.length) {
        setErrors(errBucket);
      }
    }

    hydrate();
  }, []);

  const omniTarget = useMemo(() => {
    const omni = summary.globalSettings?.omni_config;
    if (!summary.globalSettings || !omni) {
      return null;
    }

    return {
      enabled: summary.globalSettings.omni_enabled && omni.enabled,
      host: omni.host ?? '—',
      instance: omni.instance ?? '—',
      recipient: omni.recipient ?? '—',
      recipientType: omni.recipient_type ?? 'phone',
    };
  }, [summary.globalSettings]);

  return (
    <main className="container">
      <header>
        <h1>Forge Control Panel</h1>
        <p className="tagline">
          Dedicated forge experience layered on top of upstream Automagik services.
        </p>
      </header>

      {errors.length > 0 && (
        <section className="alerts">
          {errors.map((error) => (
            <div className="card error" key={error}>
              <span className="status-label" data-state="error">
                ISSUE
              </span>
              <p className="message">{error}</p>
            </div>
          ))}
        </section>
      )}

      <section className="status">
        <h2>Backend Status</h2>
        {summary.health ? (
          <div className="card">
            <span className="status-label" data-state={summary.health.status}>
              {summary.health.status.toUpperCase()}
            </span>
            <div>
              <p className="service">{summary.health.service}</p>
              <p className="message">{summary.health.message}</p>
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
        <h2>Omni Configuration</h2>
        {omniTarget ? (
          <div className="card">
            <span className="status-label" data-state={omniTarget.enabled ? 'ok' : 'warning'}>
              {omniTarget.enabled ? 'ACTIVE' : 'DISABLED'}
            </span>
            <div className="stack">
              <div>
                <p className="label">Host</p>
                <p className="value">{omniTarget.host}</p>
              </div>
              <div>
                <p className="label">Instance</p>
                <p className="value">{omniTarget.instance}</p>
              </div>
              <div>
                <p className="label">Recipient</p>
                <p className="value">
                  {omniTarget.recipient} ({omniTarget.recipientType})
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card muted">
            <span className="status-label" data-state="pending">
              PENDING
            </span>
            <p className="message">Waiting for forge config data…</p>
          </div>
        )}
      </section>

      {SAMPLE_TASK_ID && (
        <section className="status">
          <h2>Branch Template Preview</h2>
          {summary.branchTemplate ? (
            <div className="card">
              <span
                className="status-label"
                data-state={summary.branchTemplate.enabled ? 'ok' : 'warning'}
              >
                {summary.branchTemplate.enabled ? 'ENABLED' : 'DISABLED'}
              </span>
              <div>
                <p className="label">Template</p>
                <p className="value">
                  {summary.branchTemplate.branch_template ?? '— no template set —'}
                </p>
                <p className="meta">
                  task: {summary.branchTemplate.task_id} · project: {summary.branchTemplate.project_id}
                </p>
              </div>
            </div>
          ) : (
            <div className="card muted">
              <span className="status-label" data-state="pending">
                PENDING
              </span>
              <p className="message">Waiting for branch template data…</p>
            </div>
          )}
        </section>
      )}

      <footer>
        <p>More controls coming soon. Visit the legacy UI at /legacy while migration continues.</p>
      </footer>
    </main>
  );
}
