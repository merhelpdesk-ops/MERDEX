import type { ReactNode } from "react";
import {
  LocaleCode,
  LocaleEnum,
  LocaleProvider,
  defaultLanguages,
  importLocaleJsonModule,
} from "@orderly.network/i18n";
import type { AsyncResources, LocaleJsonModule } from "@orderly.network/i18n";
import extendEnLocale from "../../locales/en.json";

const baseLoaders = import.meta.glob<LocaleJsonModule>(
  "/node_modules/@orderly.network/i18n/dist/locales/*.json",
);

const extendLoaders = import.meta.glob<LocaleJsonModule>(
  "../../locales/*.json",
);

async function loadBase(lang: LocaleCode): Promise<Record<string, string>> {
  const key = `/node_modules/@orderly.network/i18n/dist/locales/${lang}.json`;
  return importLocaleJsonModule(baseLoaders[key]);
}

async function loadExtend(lang: LocaleCode): Promise<Record<string, string>> {
  const key = `../../locales/${lang}.json`;
  return importLocaleJsonModule(extendLoaders[key]);
}

const resources: AsyncResources = async (lang) => {
  if (lang === LocaleEnum.en) {
    return extendEnLocale;
  }

  const [base, extend] = await Promise.all([loadBase(lang), loadExtend(lang)]);
  return { ...base, ...extend };
};

const onLanguageChanged = async () => {
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    url.searchParams.delete("lang");
    window.history.replaceState({}, "", url.toString());
  }
};

type OrderlyLocaleProviderProps = {
  children: ReactNode;
};

export const OrderlyLocaleProvider = (props: OrderlyLocaleProviderProps) => {
  const filteredLanguages = defaultLanguages.filter((lang) =>
    lang.localCode === LocaleEnum.en,
  );

  return (
    <LocaleProvider
      resources={resources}
      locale={LocaleEnum.en}
      languages={filteredLanguages}
      onLanguageChanged={onLanguageChanged}
    >
      {props.children}
    </LocaleProvider>
  );
};
