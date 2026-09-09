import { useEffect } from "react";

// Onboard renders in a shadow root, so global CSS cannot reach these wrappers.
const mobileModalStyles = `
  @media (max-width: 767px) {
    :host .background.full-screen-background {
      height: 99vh;
      height: 99dvh;
    }

    :host .modal-container-mobile.modal-position {
      bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
    }

    :host .modal-container-mobile .max-height {
      max-height: calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 24px);
      max-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 24px);
      min-height: 0;
    }

    :host .modal-container-mobile .modal-overflow {
      min-height: 0;
    }

    :host .modal-container-mobile .modal {
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior-y: contain;
      padding-bottom: 12px;
    }
  }
`;

export function useWalletModalViewport() {
  useEffect(() => {
    const styles = new Map<ShadowRoot, HTMLStyleElement>();

    const applyStyles = () => {
      document.querySelectorAll("onboard-v2").forEach((host) => {
        const root = host.shadowRoot;
        if (!root || styles.has(root)) return;

        const style = document.createElement("style");
        style.textContent = mobileModalStyles;
        root.appendChild(style);
        styles.set(root, style);
      });
    };

    // The wallet SDK mounts its host directly under body, asynchronously.
    const observer = new MutationObserver(applyStyles);
    observer.observe(document.body, { childList: true });
    applyStyles();

    return () => {
      observer.disconnect();
      styles.forEach((style) => style.remove());
    };
  }, []);
}
