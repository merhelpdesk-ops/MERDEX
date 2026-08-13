import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

async function loadRuntimeConfig() {
  await new Promise<void>((resolve) => {
    const script = document.createElement("script");
    script.src = `${import.meta.env.BASE_URL}config.js`;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

void loadRuntimeConfig().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
