// Forge-specific type definitions

export interface OmniConfig {
  enabled: boolean;
  host: string | null;
  api_key: string | null;
  instance: string | null;
  recipient: string | null;
  recipient_type: 'PhoneNumber' | 'UserId' | 'DiscordChannel' | 'TelegramChat' | null;
}

export interface ForgeProjectSettings {
  omni_enabled: boolean;
  omni_config?: OmniConfig;
}
