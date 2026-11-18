import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@juangcarmona/lighthouse-ui/tokens.css";
import { SessionGate } from "./SessionGate";
import { App } from "./App";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {import.meta.env.VITE_SCOREMAP_PRIVATE === "1" ? <SessionGate /> : <App />}
  </StrictMode>,
);
