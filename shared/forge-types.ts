// Forge-specific types not generated from Rust

export interface OmniConfig {
  enabled: boolean;
  host: string | null;
  api_key: string | null;
  instance: string | null;
  recipient: string | null;
  recipient_type: string | null;
}

export interface ForgeProjectSettings {
  omni_enabled: boolean;
  omni_config?: OmniConfig;
}