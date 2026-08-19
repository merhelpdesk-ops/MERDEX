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

  it("removes registered listeners when a wallet session disconnects", () => {
    const on = vi.fn();
    const removeListener = vi.fn();
    const listener = vi.fn();
    const adapter = createStableEip1193Provider();
    adapter.updateTarget({ request: vi.fn(), on, removeListener }, "okx:0x123");

    adapter.provider.on?.("accountsChanged", listener);
    adapter.updateTarget(undefined, undefined);

    expect(on).toHaveBeenCalledWith("accountsChanged", listener);
    expect(removeListener).toHaveBeenCalledWith("accountsChanged", listener);
  });
});
