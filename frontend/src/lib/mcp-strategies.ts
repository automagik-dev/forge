import { McpConfig, type JsonValue } from 'shared/types';

type JsonRecord = Record<string, JsonValue>;

const isJsonRecord = (value: JsonValue): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export class McpConfigStrategyGeneral {
  static createFullConfig(cfg: McpConfig): JsonRecord {
    const cloned = JSON.parse(JSON.stringify(cfg.template)) as JsonValue;
    if (!isJsonRecord(cloned)) {
      throw new Error('MCP template must be a JSON object');
    }

    const fullConfig: JsonRecord = cloned;
    let current: JsonRecord = fullConfig;

    for (let i = 0; i < cfg.servers_path.length - 1; i++) {
      const key = cfg.servers_path[i];
      if (!isJsonRecord(current[key])) {
        current[key] = {};
      }
      current = current[key] as JsonRecord;
    }

    if (cfg.servers_path.length > 0) {
      const lastKey = cfg.servers_path[cfg.servers_path.length - 1];
      current[lastKey] = cfg.servers;
    }

    return fullConfig;
  }

  static validateFullConfig(
    mcp_config: McpConfig,
    full_config: JsonRecord
  ): void {
    let current: JsonValue = full_config;
    for (const key of mcp_config.servers_path) {
      if (!isJsonRecord(current)) {
        throw new Error(
          `Missing required field at path: ${mcp_config.servers_path.join('.')}`
        );
      }
      current = current[key];
    }

    if (!isJsonRecord(current)) {
      throw new Error('Servers configuration must be an object');
    }
  }

  static extractServersForApi(
    mcp_config: McpConfig,
    full_config: JsonRecord
  ): JsonRecord {
    let current: JsonValue = full_config;
    for (const key of mcp_config.servers_path) {
      if (!isJsonRecord(current)) {
        throw new Error(
          `Missing required field at path: ${mcp_config.servers_path.join('.')}`
        );
      }
      current = current[key];
    }

    if (!isJsonRecord(current)) {
      throw new Error('Servers configuration must be an object');
    }

    return current;
  }

  static addPreconfiguredToConfig(
    mcp_config: McpConfig,
    existingConfig: JsonRecord | null | undefined,
    serverKey: string
  ): JsonRecord {
    const preconfiguredValue = mcp_config.preconfigured as JsonValue;
    if (!isJsonRecord(preconfiguredValue) || !(serverKey in preconfiguredValue)) {
      throw new Error(`Unknown preconfigured server '${serverKey}'`);
    }
    const preconfigured = preconfiguredValue as JsonRecord;

    const updated = JSON.parse(JSON.stringify(existingConfig ?? {})) as JsonRecord;
    let current: JsonRecord = updated;

    for (let i = 0; i < mcp_config.servers_path.length - 1; i++) {
      const key = mcp_config.servers_path[i];
      if (!isJsonRecord(current[key])) {
        current[key] = {};
      }
      current = current[key] as JsonRecord;
    }

    const lastKey = mcp_config.servers_path[mcp_config.servers_path.length - 1];
    if (!isJsonRecord(current[lastKey])) {
      current[lastKey] = {};
    }

    const servers = current[lastKey] as JsonRecord;
    servers[serverKey] = preconfigured[serverKey];

    return updated;
  }
}
