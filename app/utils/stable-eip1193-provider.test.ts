import { describe, expect, it, vi } from "vitest";
import { createStableEip1193Provider } from "./stable-eip1193-provider";

describe("createStableEip1193Provider", () => {
  it("keeps a stable provider identity when the SDK replaces its wrapper", () => {
    const adapter = createStableEip1193Provider();
    const first = { request: vi.fn() };
    const second = { request: vi.fn() };

    adapter.updateTarget(first, "okx:0x123");
    const stableProvider = adapter.provider;
    adapter.updateTarget(second, "okx:0x123");

    expect(adapter.provider).toBe(stableProvider);
  });

  it("coalesces concurrent account reads", async () => {
    let resolveRequest: (value: unknown) => void = () => undefined;
    const request = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const adapter = createStableEip1193Provider();
    adapter.updateTarget({ request }, "okx:0x123");

    const reads = Array.from({ length: 20 }, () =>
      adapter.provider.request({ method: "eth_accounts" }),
    );
    resolveRequest(["0x123"]);

    await expect(Promise.all(reads)).resolves.toEqual(
      Array.from({ length: 20 }, () => ["0x123"]),
    );
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("reuses the previous result identity when the value is unchanged", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(["0x123"])
      .mockResolvedValueOnce(["0x123"]);
    const adapter = createStableEip1193Provider();
    adapter.updateTarget({ request }, "okx:0x123");

    const first = await adapter.provider.request({ method: "eth_accounts" });
    adapter.updateContext("0x123:1");
    const second = await adapter.provider.request({ method: "eth_accounts" });

    expect(second).toBe(first);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("does not let a stale session response replace the current cache", async () => {
    let resolveOldRequest: (value: unknown) => void = () => undefined;
    const oldRequest = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveOldRequest = resolve;
        }),
    );
    const newRequest = vi.fn().mockResolvedValue(["0x456"]);
    const adapter = createStableEip1193Provider();
    adapter.updateTarget({ request: oldRequest }, "okx:0x123");

    const staleRead = adapter.provider.request({ method: "eth_accounts" });
    adapter.updateTarget({ request: newRequest }, "okx:0x456");
    await expect(
      adapter.provider.request({ method: "eth_accounts" }),
    ).resolves.toEqual(["0x456"]);
    resolveOldRequest(["0x123"]);
    await staleRead;

    await expect(
      adapter.provider.request({ method: "eth_accounts" }),
    ).resolves.toEqual(["0x456"]);
    expect(newRequest).toHaveBeenCalledOnce();
  });

  it("removes registered listeners when a wallet session disconnects", () => {
    const on = vi.fn();
    const removeListener = vi.fn();
    const listener = vi.fn();
    const adapter = createStableEip1193Provider();
    adapter.updateTarget({ request: vi.fn(), on, removeListener }, "okx:0x123");

    adapter.provider.on?.("accountsChanged", listener);
    adapter.updateTarget(undefined, undefined);

    const wrappedListener = on.mock.calls[0]?.[1];
    expect(wrappedListener).not.toBe(listener);
    expect(removeListener).toHaveBeenCalledWith(
      "accountsChanged",
      wrappedListener,
    );
  });

  it("suppresses repeated account events with identical values", () => {
    const on = vi.fn();
    const listener = vi.fn();
    const adapter = createStableEip1193Provider();
    adapter.updateTarget({ request: vi.fn(), on }, "okx:0x123");
    adapter.provider.on?.("accountsChanged", listener);

    const wrappedListener = on.mock.calls[0]?.[1];
    wrappedListener(["0x123"]);
    wrappedListener(["0x123"]);
    wrappedListener(["0x456"]);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, ["0x123"]);
    expect(listener).toHaveBeenNthCalledWith(2, ["0x456"]);
  });
});
