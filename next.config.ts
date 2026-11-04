import type { NextConfig } from "next";

/**
 * Im Dev-Modus blockiert Next.js Anfragen von fremden Hostnamen.
 * Damit Smartphones im selben WLAN (z. B. http://192.168.1.20:3000) beitreten können,
 * erlauben wir typische private Netzwerkbereiche. Eigene Hostnamen lassen sich über
 * ALLOWED_DEV_ORIGINS (kommagetrennt) ergänzen.
 */
const extraOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
    "*.local",
    ...extraOrigins,
  ],
};

export default nextConfig;
