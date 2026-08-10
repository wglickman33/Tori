import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/main.scss";
import { bootstrapAuthSession } from "./store/authStore";
import { applyTheme } from "./utils/theme";
import App from "./App";

applyTheme();
void bootstrapAuthSession();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
