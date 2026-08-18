import { lazy } from "react";
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

async function removeLegacyServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister()),
    );

    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.endsWith("-dex-v1"))
          .map((cacheName) => caches.delete(cacheName)),
      );
    }
  } catch (error) {
    console.warn("Failed to remove legacy service worker:", error);
  }
}

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
  void removeLegacyServiceWorker();
  void initializeAnalyticsFromRuntimeConfig();

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>,
  );
});
