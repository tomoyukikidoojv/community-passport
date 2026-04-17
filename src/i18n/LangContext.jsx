import { createContext, useContext, useState } from "react";
import T, { t as _t } from "./translations";

const LangContext = createContext({ lang: "ja", setLang: () => {}, t: (k) => k });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("cp_lang") || "ja");

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem("cp_lang", l);
  };

  const t = (key, params = {}) => _t(key, lang, params);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
