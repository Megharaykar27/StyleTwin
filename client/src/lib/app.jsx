// App-wide state: the logged-in user and server config (AI mode, free try-on, sample models)
import { createContext, useContext, useEffect, useState } from "react";
import API from "./api";

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("st_user"));
    } catch {
      return null;
    }
  });
  const [config, setConfig] = useState({ aiMode: null, freeTryOn: false, sampleModels: [] });

  useEffect(() => {
    API.get("/config").then((r) => setConfig(r.data)).catch(() => setConfig({ aiMode: "offline", freeTryOn: false, sampleModels: [] }));
    const onLogout = () => setUser(null);
    window.addEventListener("st:logout", onLogout);
    return () => window.removeEventListener("st:logout", onLogout);
  }, []);

  const login = (u, token) => {
    localStorage.setItem("st_token", token);
    localStorage.setItem("st_user", JSON.stringify(u));
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem("st_token");
    localStorage.removeItem("st_user");
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, logout, ...config }}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);

export const CATEGORY_LABEL = { top: "Top", bottom: "Bottom", dress: "Dress", outerwear: "Layer", shoes: "Shoes", accessory: "Accessory" };
