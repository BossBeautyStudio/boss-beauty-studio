"use client";

// ============================================================
// Page Parrainage — /dashboard/parrainage
//
// Affiche :
//   - Le lien de parrainage unique à copier
//   - Les stats (parrainées inscrites, converties, crédits)
//   - Explication du programme
// ============================================================

import { useEffect, useState } from "react";

interface ReferralStats {
  code: string;
  registered: number;
  converted: number;
  creditMonths: number;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://bossbeautystudio.site";

export default function ParrainagePage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const referralUrl = stats
    ? `${APP_URL}/login?ref=${stats.code}`
    : "";

  async function handleCopy() {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Programme de parrainage 🎁
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Invite une collègue — tu gagnes 1 mois offert quand elle s&apos;abonne.
        </p>
      </div>

      {/* Lien de parrainage */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Ton lien unique
        </p>

        {loading ? (
          <div className="h-11 rounded-xl animate-pulse" style={{ backgroundColor: "var(--border)" }} />
        ) : (
          <div className="flex items-center gap-2">
            <div
              className="flex-1 rounded-xl px-4 py-2.5 text-sm font-mono truncate"
              style={{
                backgroundColor: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
              }}
            >
              {referralUrl}
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: copied ? "#D6F5E3" : "var(--accent)",
                color: copied ? "#1A7A40" : "#fff",
              }}
            >
              {copied ? "✓ Copié !" : "Copier"}
            </button>
          </div>
        )}

        {/* Partage rapide Instagram */}
        {!loading && stats && (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => {
                const text = encodeURIComponent(
                  `Tu cherches à créer du contenu Instagram pour ton activité beauté sans y passer des heures ? J'utilise Boss Beauty Studio et c'est top 💅 Essaie gratuitement → ${referralUrl}`
                );
                // Copier le message prêt à coller dans les DMs
                navigator.clipboard.writeText(decodeURIComponent(text));
                alert("Message copié ! Colle-le dans tes DMs Instagram ou ta story 📲");
              }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              Copier message Instagram
            </button>

            <button
              onClick={() => {
                const text = encodeURIComponent(
                  `Tu cherches à créer du contenu Instagram pour ton activité beauté sans y passer des heures ? J'utilise Boss Beauty Studio et c'est top 💅 Essaie gratuitement → ${referralUrl}`
                );
                window.open(`https://wa.me/?text=${text}`, "_blank");
              }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.096.54 4.07 1.486 5.787L0 24l6.394-1.673A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.213-3.797.994 1.01-3.7-.234-.38A9.818 9.818 0 1112 21.818z"/>
              </svg>
              Partager WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Invitées inscrites",
            value: loading ? "—" : String(stats?.registered ?? 0),
            icon: "👥",
            desc: "ont créé un compte",
          },
          {
            label: "Abonnées",
            value: loading ? "—" : String(stats?.converted ?? 0),
            icon: "✨",
            desc: "ont souscrit",
          },
          {
            label: "Mois offerts",
            value: loading ? "—" : String(stats?.creditMonths ?? 0),
            icon: "🎁",
            desc: "crédits disponibles",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4 text-center space-y-1"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="text-2xl">{stat.icon}</div>
            <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              {stat.value}
            </div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Comment ça marche */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Comment ça marche ?
        </p>

        <div className="space-y-3">
          {[
            {
              step: "1",
              title: "Tu partages ton lien",
              desc: "Envoie ton lien de parrainage à tes collègues esthéticiennes, coiffeuses ou nail artists.",
            },
            {
              step: "2",
              title: "Elle s'inscrit et teste",
              desc: "Elle crée son compte gratuitement depuis ton lien et découvre Boss Beauty Studio.",
            },
            {
              step: "3",
              title: "Elle s'abonne → tu gagnes 1 mois",
              desc: "Dès qu'elle prend un abonnement à 29€/mois, tu reçois automatiquement 1 mois offert sur le tien.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {item.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Crédit actif */}
      {!loading && stats && stats.creditMonths > 0 && (
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ backgroundColor: "#D6F5E3", border: "1px solid #A8DDB5" }}
        >
          <span className="text-xl">🎉</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1A7A40" }}>
              Tu as {stats.creditMonths} mois offert{stats.creditMonths > 1 ? "s" : ""} !
            </p>
            <p className="text-xs" style={{ color: "#2D9B55" }}>
              Tes crédits seront appliqués automatiquement lors de ta prochaine période de renouvellement.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
