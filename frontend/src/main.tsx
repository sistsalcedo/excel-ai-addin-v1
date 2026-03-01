import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./ui/App";

function renderApp() {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

declare const Office: any;

if (typeof Office !== "undefined" && Office.onReady) {
  Office.onReady((info: any) => {
    if (info.host === Office.HostType.Excel) {
      renderApp();
    }
  });
} else {
  // Permite ejecutar la app en un navegador normal durante el desarrollo.
  renderApp();
}

