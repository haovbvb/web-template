import { beforeEach, describe, expect, it, vi } from 'vitest';

function setBrowserLanguage(language: string) {
  Object.defineProperty(window.navigator, 'language', {
    value: language,
    configurable: true,
  });
}

describe('i18n locale resolution', () => {
  beforeEach(() => {
    localStorage.clear();
    setBrowserLanguage('en-US');
    vi.resetModules();
  });

  it('prefers saved locale from localStorage', async () => {
    localStorage.setItem('app.locale', 'zh-CN');
    const { i18n } = await import('./index');

    expect(i18n.global.locale.value).toBe('zh-CN');
  });

  it('uses zh-CN for Chinese browser locale', async () => {
    setBrowserLanguage('zh-CN');
    const { i18n } = await import('./index');

    expect(i18n.global.locale.value).toBe('zh-CN');
  });

  it('uses en-US for non-Chinese browser locale', async () => {
    setBrowserLanguage('en-US');
    const { i18n } = await import('./index');

    expect(i18n.global.locale.value).toBe('en-US');
  });

  it('setAppLocale updates locale and localStorage', async () => {
    const { i18n, setAppLocale } = await import('./index');

    setAppLocale('en-US');

    expect(i18n.global.locale.value).toBe('en-US');
    expect(localStorage.getItem('app.locale')).toBe('en-US');
  });
});
