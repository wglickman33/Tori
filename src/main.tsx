import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/main.scss";
import { bootstrapAuthSession } from "./store/authStore";
import { initThemeSync, waitForSettingsHydration } from "./store/settingsStore";
import App from "./App";

initThemeSync();
void waitForSettingsHydration().then(() => {
  initThemeSync();
});
void bootstrapAuthSession();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
