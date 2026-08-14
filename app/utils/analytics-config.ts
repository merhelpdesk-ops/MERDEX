import { z } from "zod";

const GA4_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,20}$/;
const FIREBASE_API_KEY_PATTERN = /^AIza[0-9A-Za-z_-]{20,}$/;
const FIREBASE_API_KEY_MAX_LENGTH = 128;
const FIREBASE_PROJECT_ID_PATTERN = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;
const FIREBASE_APP_ID_PATTERN = /^1:\d{6,20}:web:[0-9a-fA-F]{6,64}$/;
const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

const measurementIdSchema = z
  .string()
  .trim()
  .regex(GA4_MEASUREMENT_ID_PATTERN, "Invalid GA4 measurement ID");

const hostnameSchema = z
  .string()
  .trim()
  .max(253)
  .regex(HOSTNAME_PATTERN, "Invalid hostname");

const ga4ConfigSchema = z.strictObject({
  version: z.literal(1),
  provider: z.literal("ga4"),
  measurementId: measurementIdSchema,
});

const firebaseConfigSchema = z.strictObject({
  version: z.literal(1),
  provider: z.literal("firebase"),
  apiKey: z
    .string()
    .trim()
    .max(
      FIREBASE_API_KEY_MAX_LENGTH,
      `Firebase API key must be ${FIREBASE_API_KEY_MAX_LENGTH} characters or fewer`,
    )
    .regex(FIREBASE_API_KEY_PATTERN, "Invalid Firebase API key"),
  projectId: z
    .string()
    .trim()
    .regex(FIREBASE_PROJECT_ID_PATTERN, "Invalid Firebase project ID"),
  appId: z
    .string()
    .trim()
    .regex(FIREBASE_APP_ID_PATTERN, "Invalid Firebase app ID"),
  measurementId: measurementIdSchema,
});

const plausibleConfigSchema = z.strictObject({
  version: z.literal(1),
  provider: z.literal("plausible"),
  domain: hostnameSchema,
});

export const AnalyticsConfigV1Schema = z.discriminatedUnion("provider", [
  ga4ConfigSchema,
  firebaseConfigSchema,
  plausibleConfigSchema,
]);

export type AnalyticsConfigV1 = z.infer<typeof AnalyticsConfigV1Schema>;
