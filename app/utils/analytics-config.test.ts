import { describe, expect, it } from "vitest";
import { AnalyticsConfigV1Schema } from "./analytics-config";

const firebaseConfig = {
  version: 1 as const,
  provider: "firebase" as const,
  apiKey: "AIzaSyCe7LfodulsiuiHMnJIEGZbMjywgplmS04",
  projectId: "kongo-d7ffa",
  appId: "1:468973965344:web:245eeab3e660123ea02c45",
  measurementId: "G-6LKNEJCNW7",
};

describe("AnalyticsConfigV1Schema", () => {
  it("accepts the supported deployment configurations", () => {
    expect(
      AnalyticsConfigV1Schema.safeParse({
        version: 1,
        provider: "ga4",
        measurementId: "G-ABC12345",
      }).success,
    ).toBe(true);
    expect(AnalyticsConfigV1Schema.safeParse(firebaseConfig).success).toBe(
      true,
    );
    expect(
      AnalyticsConfigV1Schema.safeParse({
        version: 1,
        provider: "plausible",
        domain: "trade.example.com",
      }).success,
    ).toBe(true);
  });

  it("rejects unknown keys and unsupported providers", () => {
    expect(
      AnalyticsConfigV1Schema.safeParse({
        version: 1,
        provider: "ga4",
        measurementId: "G-ABC12345",
        script: "<script>alert(1)</script>",
      }).success,
    ).toBe(false);
    expect(
      AnalyticsConfigV1Schema.safeParse({
        version: 1,
        provider: "custom",
        src: "https://example.com/tracker.js",
      }).success,
    ).toBe(false);
  });

  it("rejects malformed identifiers and Plausible URLs", () => {
    expect(
      AnalyticsConfigV1Schema.safeParse({
        version: 1,
        provider: "ga4",
        measurementId: "UA-123",
      }).success,
    ).toBe(false);
    expect(
      AnalyticsConfigV1Schema.safeParse({
        version: 1,
        provider: "plausible",
        domain: "https://plausible.io/collect",
      }).success,
    ).toBe(false);
    expect(
      AnalyticsConfigV1Schema.safeParse({
        version: 1,
        provider: "plausible",
        domain: "trade.example.com",
        endpoint: "https://analytics.example.com/api/event",
      }).success,
    ).toBe(false);
  });

  it("rejects unsupported Firebase fields", () => {
    for (const extraField of [
      { authDomain: "kongo-d7ffa.firebaseapp.com" },
      { storageBucket: "kongo-d7ffa.firebasestorage.app" },
      { messagingSenderId: "468973965344" },
    ]) {
      expect(
        AnalyticsConfigV1Schema.safeParse({
          ...firebaseConfig,
          ...extraField,
        }).success,
      ).toBe(false);
    }
  });

  it("rejects oversized Firebase API keys", () => {
    expect(
      AnalyticsConfigV1Schema.safeParse({
        ...firebaseConfig,
        apiKey: `AIza${"a".repeat(128)}`,
      }).success,
    ).toBe(false);
  });
});
