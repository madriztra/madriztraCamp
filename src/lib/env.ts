// lib/env.ts

export function getEnv(
  name: string,
  fallback?: string
): string {
  const value = process.env[name];

  if (
    value !== undefined &&
    value !== null &&
    value.trim() !== ""
  ) {
    return value;
  }

  if (
    fallback !== undefined &&
    fallback !== null &&
    fallback !== ""
  ) {
    return fallback;
  }

  throw new Error(
    `Missing required environment variable: ${name}`
  );
}

export function getOptionalEnv(
  name: string
): string | undefined {
  const value = process.env[name];

  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : undefined;
}

export function getBooleanEnv(
  name: string,
  fallback = false
): boolean {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  return [
    "1",
    "true",
    "yes",
    "on"
  ].includes(value.toLowerCase());
}

export function absoluteUrl(
  path = "/"
): string {
  const baseUrl =
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  return new URL(path, baseUrl).toString();
}