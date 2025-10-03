import { describe, expect, it } from 'vitest';
import type { ForgeProjectSettings } from '../../shared/forge-types';
import {
  describeOmniField,
  formatTimestamp,
  normaliseConfigDraft,
  omniConfigErrors,
  omniConfigFor,
  statusTone,
  toastToneColor,
} from './App';

describe('omniConfigFor', () => {
  it('promotes omni enabled flag into config', () => {
    const settings: ForgeProjectSettings = {
      omni_enabled: true,
      branch_templates_enabled: true,
      omni_config: {
        enabled: false,
        host: 'https://omni.example',
        api_key: 'secret',
        instance: 'forge',
        recipient: '+1234',
        recipient_type: 'PhoneNumber',
      },
    };

    const config = omniConfigFor(settings);
    expect(config.enabled).toBe(true);
    expect(config.host).toBe('https://omni.example');
  });
});

describe('normaliseConfigDraft', () => {
  it('creates a deep copy with normalised omni config', () => {
    const settings: ForgeProjectSettings = {
      omni_enabled: true,
      branch_templates_enabled: true,
      omni_config: {
        enabled: true,
        host: 'https://omni.example',
        api_key: 'secret',
        instance: 'forge',
        recipient: '+1234',
        recipient_type: 'PhoneNumber',
      },
    };

    const draft = normaliseConfigDraft(settings);

    expect(draft).not.toBe(settings);
    expect(draft.omni_config).not.toBe(settings.omni_config);
    expect(draft.omni_config?.enabled).toBe(true);

    settings.omni_config!.host = 'https://mutated.invalid';
    expect(draft.omni_config?.host).toBe('https://omni.example');
  });
});

describe('omniConfigErrors', () => {
  it('flags required fields when Omni is enabled', () => {
    const config = omniConfigFor({
      omni_enabled: true,
      branch_templates_enabled: true,
      omni_config: {
        enabled: true,
        host: null,
        api_key: null,
        instance: '',
        recipient: '   ',
        recipient_type: null,
      },
    });

    const errors = omniConfigErrors(config);
    expect(errors).toEqual(['host', 'instance', 'recipient']);
    expect(errors.map(describeOmniField)).toEqual([
      'Host URL',
      'Instance name',
      'Recipient contact',
    ]);
  });

  it('returns empty array when Omni is disabled', () => {
    const config = omniConfigFor({
      omni_enabled: false,
      branch_templates_enabled: true,
      omni_config: null,
    });

    expect(omniConfigErrors(config)).toEqual([]);
  });
});

describe('formatting helpers', () => {
  it('formats timestamps defensively', () => {
    expect(formatTimestamp(null)).toBe('—');
    expect(formatTimestamp('not-a-date')).toBe('not-a-date');
  });

  it('maps status tones to styles', () => {
    expect(statusTone('SENT')).toBe('success');
    expect(statusTone('FAILED')).toBe('error');
    expect(statusTone('Queued')).toBe('info');
    expect(toastToneColor('error')).toBe('#ff7b8a');
  });
});
