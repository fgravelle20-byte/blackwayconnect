import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { copy, type Lang, type Copy } from "./copy";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Copy;
  path: (p: string) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");
  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      t: copy[lang],
      path: (p: string) => (lang === "en" ? `/en${p === "/" ? "" : p}` : p),
    }),
    [lang],
  );
  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang outside provider");
  return ctx;
}
