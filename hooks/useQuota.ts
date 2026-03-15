"use client";

// ============================================================
// hooks/useQuota.ts
//
// Fetch l'état du quota utilisateur depuis GET /api/user/quota.
//
// Usage :
//   const { quota, loading, error, refresh } = useQuota();
//
// Retourne :
//   quota   — QuotaStatus | null
//   loading — true pendant le fetch initial
//   error   — message d'erreur string | null
//   refresh — recharge manuellement le quota
// ============================================================

import { useState, useEffect, useCallback } from "react";

export interface QuotaStatus {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetAt: string; // ISO string
}

interface UseQuotaResult {
  quota: QuotaStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useQuota(): UseQuotaResult {
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/user/quota", { cache: "no-store" });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erreur ${res.status}`);
      }

      const body = await res.json();
      setQuota(body.quota);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return { quota, loading, error, refresh: fetchQuota };
}
