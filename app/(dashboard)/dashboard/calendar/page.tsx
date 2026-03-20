"use client";

// ============================================================
// app/(dashboard)/dashboard/calendar/page.tsx
//
// Calendrier éditorial — vue mensuelle.
// Permet de planifier, visualiser et tracker son contenu Instagram.
//
// Fonctionnalités :
//   — Vue mois avec navigation prev/next
//   — Badges colorés par type de contenu sur chaque jour
//   — Clic sur un jour → panneau avec détails + formulaire ajout
//   — Toggle statut : 💡 Idée → 📅 Planifié → ✅ Publié
//   — Suppression d'une entrée
// ============================================================

import { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ModuleType = "post" | "carousel" | "story" | "reel" | "dm" | "hooks";
type StatusType = "idee" | "planifie" | "publie";

interface CalendarEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  module: ModuleType;
  status: StatusType;
  note?: string | null;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const MOIS_NOMS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const MODULE_CONFIG: Record<ModuleType, { label: string; color: string; icon: string }> = {
  post:     { label: "Post",     color: "#C4956A", icon: "📝" },
  carousel: { label: "Carrousel", color: "#6b9fd4", icon: "🖼️" },
  story:    { label: "Story",    color: "#7fc9a0", icon: "📸" },
  reel:     { label: "Reel",     color: "#9b7fd4", icon: "🎬" },
  dm:       { label: "DM",       color: "#e8a87c", icon: "💬" },
  hooks:    { label: "Accroche", color: "#f0c040", icon: "⚡" },
};

const STATUS_CONFIG: Record<StatusType, { label: string; next: StatusType; icon: string; color: string }> = {
  idee:     { label: "Idée",     next: "planifie", icon: "💡", color: "#888" },
  planifie: { label: "Planifié", next: "publie",   icon: "📅", color: "#6b9fd4" },
  publie:   { label: "Publié",   next: "idee",     icon: "✅", color: "#7fc9a0" },
};

const MODULE_OPTIONS: ModuleType[] = ["post", "carousel", "story", "reel", "dm", "hooks"];

// ── Utilitaires calendrier ────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): (number | null)[] {
  // month est 1-indexé
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Dim, 1=Lun...
  const totalDays = new Date(year, month, 0).getDate();

  // Convertir pour lundi en premier (0=Lun, 6=Dim)
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  // Compléter jusqu'à multiple de 7
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isToday(year: number, month: number, day: number): boolean {
  const today = new Date();
  return today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Formulaire ajout
  const [newTitle,  setNewTitle]  = useState("");
  const [newModule, setNewModule] = useState<ModuleType>("post");
  const [newNote,   setNewNote]   = useState("");
  const [adding,    setAdding]    = useState(false);

  // ── Chargement des entrées ──────────────────────────────────────────────────

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar?year=${year}&month=${month}`);
      const data = await res.json();
      if (res.ok) setEntries(Array.isArray(data) ? data : []);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  // ── Navigation mois ─────────────────────────────────────────────────────────

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  // ── Entrées par jour ────────────────────────────────────────────────────────

  function entriesForDay(day: number): CalendarEntry[] {
    const dateStr = toDateStr(year, month, day);
    return entries.filter(e => e.date === dateStr);
  }

  // ── Ajouter une entrée ──────────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDay || !newTitle.trim()) return;
    setAdding(true);

    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date:   toDateStr(year, month, selectedDay),
          title:  newTitle.trim(),
          module: newModule,
          note:   newNote.trim() || null,
        }),
      });

      if (res.ok) {
        const entry = await res.json();
        setEntries(prev => [...prev, entry]);
        setNewTitle("");
        setNewNote("");
        setShowAddForm(false);
      }
    } catch {
      // silently ignore
    } finally {
      setAdding(false);
    }
  }

  // ── Changer le statut ───────────────────────────────────────────────────────

  async function toggleStatus(entry: CalendarEntry) {
    const nextStatus = STATUS_CONFIG[entry.status].next;

    setEntries(prev =>
      prev.map(e => e.id === entry.id ? { ...e, status: nextStatus } : e)
    );

    try {
      await fetch(`/api/calendar?id=${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      // Rollback si erreur
      setEntries(prev =>
        prev.map(e => e.id === entry.id ? { ...e, status: entry.status } : e)
      );
    }
  }

  // ── Supprimer une entrée ────────────────────────────────────────────────────

  async function deleteEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id));

    try {
      await fetch(`/api/calendar?id=${id}`, { method: "DELETE" });
    } catch {
      // silently ignore — rechargement au prochain mount
    }
  }

  // ── Données pour l'affichage ────────────────────────────────────────────────

  const days = getDaysInMonth(year, month);
  const selectedEntries = selectedDay ? entriesForDay(selectedDay) : [];

  // Compter par statut pour le résumé
  const totalIdee     = entries.filter(e => e.status === "idee").length;
  const totalPlanifie = entries.filter(e => e.status === "planifie").length;
  const totalPublie   = entries.filter(e => e.status === "publie").length;

  // ── Rendu ───────────────────────────────────────────────────────────────────

  return (
    <div className="fade-in">

      {/* En-tête */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold" style={{ color: "var(--text)" }}>
            Calendrier éditorial
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Planifie et suis ton contenu Instagram mois par mois.
          </p>
        </div>

        {/* Résumé du mois */}
        {!loading && entries.length > 0 && (
          <div className="flex shrink-0 gap-3">
            {[
              { count: totalIdee,     ...STATUS_CONFIG.idee     },
              { count: totalPlanifie, ...STATUS_CONFIG.planifie },
              { count: totalPublie,   ...STATUS_CONFIG.publie   },
            ].map(({ count, icon, label, color }) => (
              <div key={label} className="text-center">
                <p className="text-lg font-bold leading-none" style={{ color }}>{count}</p>
                <p className="mt-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {icon} {label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation mois */}
      <div
        className="mb-4 flex items-center justify-between rounded-[14px] px-5 py-3"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
          style={{ backgroundColor: "var(--surface-alt)", color: "var(--text)" }}
        >
          ←
        </button>

        <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
          {MOIS_NOMS[month - 1]} {year}
        </h2>

        <button
          type="button"
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
          style={{ backgroundColor: "var(--surface-alt)", color: "var(--text)" }}
        >
          →
        </button>
      </div>

      {/* Grille calendrier */}
      <div
        className="mb-4 overflow-hidden rounded-[16px]"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
      >
        {/* En-têtes jours */}
        <div className="grid grid-cols-7" style={{ borderBottom: "1px solid var(--border)" }}>
          {JOURS.map(j => (
            <div
              key={j}
              className="py-2 text-center text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              {j}
            </div>
          ))}
        </div>

        {/* Cellules jours */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[72px] p-1"
                  style={{
                    borderRight: (idx + 1) % 7 !== 0 ? "1px solid var(--border)" : "none",
                    borderBottom: idx < days.length - 7 ? "1px solid var(--border)" : "none",
                    backgroundColor: "var(--bg)",
                    opacity: 0.4,
                  }}
                />
              );
            }

            const dayEntries = entriesForDay(day);
            const isSelected = selectedDay === day;
            const isTodayDay = isToday(year, month, day);

            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setSelectedDay(isSelected ? null : day);
                  setShowAddForm(false);
                }}
                className="min-h-[72px] p-1.5 text-left transition-colors"
                style={{
                  borderRight: (idx + 1) % 7 !== 0 ? "1px solid var(--border)" : "none",
                  borderBottom: idx < days.length - 7 ? "1px solid var(--border)" : "none",
                  backgroundColor: isSelected
                    ? "var(--surface-alt)"
                    : "var(--surface)",
                  cursor: "pointer",
                }}
              >
                {/* Numéro du jour */}
                <div className="mb-1 flex items-center gap-1">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: isTodayDay ? "var(--accent)" : "transparent",
                      color: isTodayDay ? "#fff" : "var(--text)",
                    }}
                  >
                    {day}
                  </span>
                  {dayEntries.length > 0 && (
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {dayEntries.length > 1 ? `×${dayEntries.length}` : ""}
                    </span>
                  )}
                </div>

                {/* Badges entrées — max 3 visibles */}
                <div className="flex flex-col gap-0.5">
                  {dayEntries.slice(0, 3).map(entry => (
                    <div
                      key={entry.id}
                      className="truncate rounded px-1 py-0.5 text-[9px] font-semibold text-white"
                      style={{ backgroundColor: MODULE_CONFIG[entry.module].color }}
                    >
                      {STATUS_CONFIG[entry.status].icon} {entry.title}
                    </div>
                  ))}
                  {dayEntries.length > 3 && (
                    <div className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                      +{dayEntries.length - 3} de plus
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Légende types */}
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(MODULE_CONFIG).map(([key, { label, color, icon }]) => (
          <span
            key={key}
            className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {icon} {label}
          </span>
        ))}
      </div>

      {/* Panneau jour sélectionné */}
      {selectedDay !== null && (
        <div
          className="slide-up rounded-[16px] p-5"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          {/* En-tête panneau */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>
              {selectedDay} {MOIS_NOMS[month - 1]}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(true);
                setNewTitle("");
                setNewNote("");
              }}
              className="btn btn-primary"
              style={{ fontSize: "0.8rem", padding: "0.4rem 1rem" }}
            >
              + Ajouter
            </button>
          </div>

          {/* Formulaire ajout */}
          {showAddForm && (
            <form
              onSubmit={handleAdd}
              className="mb-4 rounded-[12px] p-4"
              style={{
                backgroundColor: "var(--surface-alt)",
                border: "1px solid var(--border)",
              }}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Nouveau contenu
              </p>

              <div className="flex flex-col gap-3">
                {/* Titre */}
                <input
                  className="input"
                  type="text"
                  placeholder="Titre du contenu — ex : Les 3 erreurs d'onglerie…"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                  autoFocus
                />

                {/* Type */}
                <div className="flex flex-wrap gap-1.5">
                  {MODULE_OPTIONS.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setNewModule(m)}
                      className="rounded-full px-2.5 py-1 text-xs font-semibold transition-colors"
                      style={{
                        backgroundColor: newModule === m ? MODULE_CONFIG[m].color : "var(--surface)",
                        color: newModule === m ? "#fff" : "var(--text-muted)",
                        border: `1px solid ${newModule === m ? MODULE_CONFIG[m].color : "var(--border)"}`,
                      }}
                    >
                      {MODULE_CONFIG[m].icon} {MODULE_CONFIG[m].label}
                    </button>
                  ))}
                </div>

                {/* Note optionnelle */}
                <input
                  className="input"
                  type="text"
                  placeholder="Note (optionnel) — angle, idée, rappel…"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={adding || !newTitle.trim()}
                    style={{ fontSize: "0.8rem" }}
                  >
                    {adding ? "Ajout…" : "Ajouter"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "0.8rem" }}
                    onClick={() => setShowAddForm(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Liste des entrées du jour */}
          {selectedEntries.length === 0 && !showAddForm && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Aucun contenu planifié ce jour. Clique sur &quot;+ Ajouter&quot; pour commencer.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {selectedEntries.map(entry => {
              const mod    = MODULE_CONFIG[entry.module];
              const status = STATUS_CONFIG[entry.status];

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-[12px] px-4 py-3"
                  style={{
                    backgroundColor: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderLeft: `3px solid ${mod.color}`,
                  }}
                >
                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                        style={{ backgroundColor: mod.color }}
                      >
                        {mod.icon} {mod.label}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                      {entry.title}
                    </p>
                    {entry.note && (
                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        {entry.note}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {/* Toggle statut */}
                    <button
                      type="button"
                      onClick={() => toggleStatus(entry)}
                      className="rounded-full px-2.5 py-1 text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: "var(--surface-alt)",
                        color: status.color,
                        border: `1px solid ${status.color}`,
                      }}
                      title="Cliquer pour changer le statut"
                    >
                      {status.icon} {status.label}
                    </button>

                    {/* Supprimer */}
                    <button
                      type="button"
                      onClick={() => deleteEntry(entry.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                      style={{
                        color: "var(--text-muted)",
                        backgroundColor: "var(--surface-alt)",
                      }}
                      title="Supprimer"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* État vide — premier mois */}
      {!loading && entries.length === 0 && selectedDay === null && (
        <div
          className="rounded-[16px] px-6 py-8 text-center"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p className="mb-2 text-2xl">🗓️</p>
          <p className="mb-1 text-base font-semibold" style={{ color: "var(--text)" }}>
            Ton calendrier est vide pour ce mois
          </p>
          <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
            Clique sur n&apos;importe quel jour pour planifier ton premier contenu.
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Astuce : génère d&apos;abord une semaine depuis{" "}
            <a
              href="/dashboard/planning"
              className="underline underline-offset-2"
              style={{ color: "var(--accent)" }}
            >
              Planning
            </a>
            , puis planifie chaque contenu dans le calendrier.
          </p>
        </div>
      )}
    </div>
  );
}
