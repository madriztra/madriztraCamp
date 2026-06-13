const developmentSecret = "music-growth-os-local-development-secret-2026";

export const authSecret =
  process.env.NEXTAUTH_SECRET ?? (process.env.NODE_ENV === "development" ? developmentSecret : undefined);
