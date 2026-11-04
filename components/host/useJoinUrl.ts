"use client";

import { useEffect, useState } from "react";
import { PUBLIC_BASE_URL } from "@/lib/config";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

/**
 * Ermittelt die Beitritts-URL für QR-Code und Anzeige.
 * Wird der Host über „localhost“ geöffnet, wird automatisch die Netzwerk-IP verwendet,
 * damit Smartphones im selben WLAN beitreten können.
 */
export function useJoinUrl(code: string) {
  const [base, setBase] = useState<string>(PUBLIC_BASE_URL);
  const [isLocalOnly, setLocalOnly] = useState(false);

  useEffect(() => {
    if (PUBLIC_BASE_URL) return;
    const { protocol, hostname, port, origin } = window.location;
    if (!LOCAL_HOSTS.has(hostname)) {
      setBase(origin);
      return;
    }
    setBase(origin);
    fetch("/api/network")
      .then((r) => r.json() as Promise<{ addresses: string[] }>)
      .then(({ addresses }) => {
        if (addresses[0]) setBase(`${protocol}//${addresses[0]}${port ? `:${port}` : ""}`);
        else setLocalOnly(true);
      })
      .catch(() => setLocalOnly(true));
  }, []);

  // Kurzlink /123456 – leitet auf /play/123456 weiter (siehe app/[code]/page.tsx).
  const url = base ? `${base.replace(/\/$/, "")}/${code}` : "";
  const display = url.replace(/^https?:\/\//, "").replace(/\/\d+$/, "");
  return { url, display, isLocalOnly };
}
