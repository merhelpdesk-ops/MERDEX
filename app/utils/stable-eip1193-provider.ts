export type Eip1193RequestArguments = {
  method: string;
  params?: readonly unknown[] | object;
};

export type Eip1193ProviderLike = {
  request: (args: Eip1193RequestArguments) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => unknown;
  removeListener?: (
    event: string,
    listener: (...args: unknown[]) => void,
  ) => unknown;
  [key: PropertyKey]: unknown;
};

type CachedResult = {
  fingerprint: string;
  value: unknown;
  validUntil: number;
};

const GUARDED_METHODS = new Set(["eth_accounts", "eth_chainId"]);
const CACHE_DURATION_MS = 500;

const fingerprint = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

/**
 * Keeps the provider identity passed to WooFi stable for a wallet session.
 * It also coalesces the account/chain preflight reads that can otherwise form
 * a feedback loop between Wagmi, Orderly and WooFi in injected mobile wallets.
 */
export function createStableEip1193Provider() {
  let activeProvider: Eip1193ProviderLike | undefined;
  let activeSession: string | undefined;
  let activeContext: string | undefined;
  const cachedResults = new Map<string, CachedResult>();
  const inFlightRequests = new Map<string, Promise<unknown>>();
  const eventListeners = new Map<string, Set<(...args: unknown[]) => void>>();

  const invalidate = () => {
    for (const cached of cachedResults.values()) {
      cached.validUntil = 0;
    }
  };

  const request = async (args: Eip1193RequestArguments) => {
    const target = activeProvider;
    if (!target || typeof target.request !== "function") {
      throw new Error("EIP-1193 provider is not available");
    }

    if (!GUARDED_METHODS.has(args.method)) {
      const result = await target.request.call(target, args);
      if (
        args.method === "eth_requestAccounts" ||
        args.method === "wallet_switchEthereumChain"
      ) {
        invalidate();
      }
      return result;
    }

    const cached = cachedResults.get(args.method);
    if (cached && cached.validUntil > Date.now()) {
      return cached.value;
    }

    const pending = inFlightRequests.get(args.method);
    if (pending) return pending;

    const nextRequest = Promise.resolve(target.request.call(target, args))
      .then((result) => {
        const nextFingerprint = fingerprint(result);
        const previous = cachedResults.get(args.method);
        const stableValue =
          previous?.fingerprint === nextFingerprint ? previous.value : result;

        cachedResults.set(args.method, {
          fingerprint: nextFingerprint,
          value: stableValue,
          validUntil: Date.now() + CACHE_DURATION_MS,
        });

        return stableValue;
      })
      .finally(() => {
        inFlightRequests.delete(args.method);
      });

    inFlightRequests.set(args.method, nextRequest);
    return nextRequest;
  };

  const detachListeners = (target: Eip1193ProviderLike | undefined) => {
    if (!target || typeof target.removeListener !== "function") return;
    for (const [event, listeners] of eventListeners) {
      for (const listener of listeners) {
        target.removeListener.call(target, event, listener);
      }
    }
  };

  const attachListeners = (target: Eip1193ProviderLike | undefined) => {
    if (!target || typeof target.on !== "function") return;
    for (const [event, listeners] of eventListeners) {
      for (const listener of listeners) {
        target.on.call(target, event, listener);
      }
    }
  };

  const on = (event: string, listener: (...args: unknown[]) => void) => {
    const listeners = eventListeners.get(event) ?? new Set();
    if (listeners.has(listener)) return provider;

    listeners.add(listener);
    eventListeners.set(event, listeners);
    activeProvider?.on?.call(activeProvider, event, listener);
    return provider;
  };

  const removeListener = (
    event: string,
    listener: (...args: unknown[]) => void,
  ) => {
    eventListeners.get(event)?.delete(listener);
    activeProvider?.removeListener?.call(activeProvider, event, listener);
    return provider;
  };

  const provider = new Proxy(
    { request, on, removeListener } as Eip1193ProviderLike,
    {
      get(_target, property) {
        if (property === "request") return request;
        if (property === "on" || property === "addListener") return on;
        if (property === "removeListener" || property === "off") {
          return removeListener;
        }

        const target = activeProvider;
        if (!target) return undefined;
        const value = Reflect.get(target, property, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
      has(_target, property) {
        return (
          property === "request" ||
          property === "on" ||
          property === "addListener" ||
          property === "removeListener" ||
          property === "off" ||
          (!!activeProvider && property in activeProvider)
        );
      },
    },
  );

  return {
    provider,
    updateTarget(nextProvider: unknown, session: string | undefined) {
      if (!session) {
        detachListeners(activeProvider);
        activeProvider = undefined;
        activeSession = undefined;
        activeContext = undefined;
        cachedResults.clear();
        inFlightRequests.clear();
        return;
      }

      // Ignore wrapper-object churn during the same connected wallet session.
      if (activeProvider && activeSession === session) return;

      detachListeners(activeProvider);
      activeProvider = nextProvider as Eip1193ProviderLike;
      attachListeners(activeProvider);
      activeSession = session;
      activeContext = undefined;
      cachedResults.clear();
      inFlightRequests.clear();
    },
    updateContext(context: string | undefined) {
      if (activeContext === context) return;
      activeContext = context;
      invalidate();
    },
  };
}

export type StableEip1193Provider = ReturnType<
  typeof createStableEip1193Provider
>;
