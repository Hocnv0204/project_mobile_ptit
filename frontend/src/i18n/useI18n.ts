import { useSettingsStore } from '../store/settingsStore';
import { translations, TranslationKey } from './translations';

type Vars = Record<string, string | number | boolean | null | undefined>;

function interpolate(template: string, vars?: Vars) {
  if (!vars) return template;
  return Object.keys(vars).reduce((acc, key) => {
    const raw = vars[key];
    const value = raw == null ? '' : String(raw);
    return acc.replaceAll(`{{${key}}}`, value);
  }, template);
}

export function useI18n() {
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const t = (key: TranslationKey, vars?: Vars) => {
    const dict = translations[language] ?? translations.vi;
    const text = dict[key] ?? translations.vi[key] ?? key;
    return interpolate(text, vars);
  };

  return { t, language, setLanguage };
}

