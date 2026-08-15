import React, { lazy } from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initializeAnalyticsFromRuntimeConfig } from "./utils/analytics";
import { withBasePath } from "./utils/base-path";
import "./styles/index.css";

const SwapLayout = lazy(() => import("./pages/swap/Layout"));
const SwapIndex = lazy(() => import("./pages/swap/Index"));

async function loadRuntimeConfig() {
  return new Promise<void>((resolve) => {
    const script = document.createElement("script");
    script.src = withBasePath("/config.js");
    script.onload = () => {
      console.log("Runtime config loaded successfully");
      resolve();
    };
    script.onerror = () => {
      console.log("Runtime config not found, using build-time env vars");
      resolve();
    };
    document.head.appendChild(script);
  });
}

const basePath = import.meta.env.BASE_URL || "/";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      errorElement: <ErrorBoundary />,
      children: [
        {
          element: <SwapLayout />,
          children: [{ index: true, element: <SwapIndex /> }],
        },
        { path: "*", element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename: basePath },
);

loadRuntimeConfig().then(() => {
  void initializeAnalyticsFromRuntimeConfig();

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <HelmetProvider>
        <RouterProvider router={router} />
      </HelmetProvider>
    </React.StrictMode>,
  );
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(withBasePath("/sw.js"))
      .then((registration) => {
        console.log("SW registered:", registration);
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  });
}
