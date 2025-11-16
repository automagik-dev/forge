import { vi } from 'vitest';

export const useTranslation = vi.fn(() => ({
  t: (key: string) => key,
  i18n: {
    changeLanguage: vi.fn(),
    language: 'en',
  },
}));

export const Trans = ({ i18nKey }: { i18nKey: string }) => i18nKey;

export const I18nextProvider = ({ children }: { children: React.ReactNode }) => children;

export const initReactI18next = {
  type: '3rdParty',
  init: vi.fn(),
};
