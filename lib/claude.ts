// ============================================================
// lib/claude.ts — Wrapper Anthropic pour Boss Beauty Studio
//
// Exports principaux :
//   MODEL          — constantes des modèles utilisés
//   safeParseJSON  — parse JSON robuste, 3 stratégies
//   callClaude     — appel API brut avec retry
//   callClaudeJSON — appel API + parse JSON avec retry dédié
//
// Fallback strategy (couche 1 et 2 du plan 4-layers) :
//   Couche 1 : safeParseJSON tente 3 extractions avant d'échouer
//   Couche 2 : callClaude retry 3× sur erreurs temporaires (429, 529…)
//              callClaudeJSON retry 2× si JSON invalide (prompt renforcé)
// ============================================================

import Anthropic from "@anthropic-ai/sdk";

// ── Modèles ──────────────────────────────────────────────────────────────────

/**
 * Haiku  → réponses DM (vitesse prioritaire, ~200ms)
 * Sonnet → planning 30j et carousels (qualité prioritaire)
 */
export const MODEL = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
} as const;

export type ClaudeModel = (typeof MODEL)[keyof typeof MODEL];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClaudeCallParams {
  model: ClaudeModel;
  system: string;
  prompt: string;
  maxTokens: number;
}

export interface ClaudeRawResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// ── Configuration ─────────────────────────────────────────────────────────────

/** Codes HTTP considérés comme temporaires → on peut retenter */
const RETRYABLE_STATUS_CODES = [429, 529, 503, 502];

/** Nombre max de tentatives pour les erreurs API */
const API_MAX_RETRIES = 3;

/** Nombre max de tentatives si Claude retourne du JSON invalide */
const JSON_MAX_RETRIES = 2;

/** Délai de base pour le backoff exponentiel (ms) */
const BASE_DELAY_MS = 1000;

// ── Client Anthropic ──────────────────────────────────────────────────────────

// Initialisation lazy — le client n'est créé qu'au premier appel API.
// Évite un crash au chargement du module si ANTHROPIC_API_KEY est absent
// (ex : environnement de développement sans clé configurée).
// L'erreur est levée dans callClaude et interceptée par le handler de route.
let _anthropic: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "Le générateur est momentanément indisponible. Réessaie dans quelques secondes."
      );
    }
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

// ── safeParseJSON ─────────────────────────────────────────────────────────────

/**
 * Parse robuste du JSON avec 3 stratégies successives.
 *
 * Stratégie 1 : JSON.parse direct (réponse propre)
 * Stratégie 2 : extrait le contenu d'un bloc ```json ... ``` (markdown)
 * Stratégie 3 : extrait le premier { ... } ou [ ... ] trouvé dans le texte
 *
 * Retourne null si aucune stratégie ne réussit.
 */
export function safeParseJSON<T>(text: string): T | null {
  // Stratégie 1 — parse direct
  try {
    return JSON.parse(text) as T;
  } catch {
    // pas de JSON propre, on continue
  }

  // Stratégie 2 — bloc markdown ```json ... ``` ou ``` ... ```
  const blockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (blockMatch?.[1]) {
    try {
      return JSON.parse(blockMatch[1].trim()) as T;
    } catch {
      // bloc mal formé, on continue
    }
  }

  // Stratégie 3 — premier objet/tableau JSON dans le texte
  // Regex greedy : capture du premier { au dernier } (ou [ au dernier ]),
  // ce qui est correct pour les objets JSON imbriqués.
  // Limite : si le texte contient deux objets JSON distincts, seul le premier
  // sera retenu (comportement voulu — on n'attend qu'un seul objet par réponse).
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch?.[1]) {
    try {
      return JSON.parse(jsonMatch[1]) as T;
    } catch {
      // JSON malformé dans le texte
    }
  }

  return null;
}

// ── callClaude ────────────────────────────────────────────────────────────────

/**
 * Appel API Anthropic avec retry sur erreurs temporaires.
 *
 * Retry : 3 tentatives max, backoff exponentiel (1s → 2s → 4s)
 * Erreurs retentables : 429 (rate limit), 529 (surcharge), 503, 502
 * Erreurs non-retentables : 400, 401, 403, 404 → exception immédiate
 *
 * Retourne le texte brut + les tokens utilisés.
 */
export async function callClaude(
  params: ClaudeCallParams
): Promise<ClaudeRawResult> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= API_MAX_RETRIES; attempt++) {
    try {
      const response = await getClient().messages.create({
        model: params.model,
        max_tokens: params.maxTokens,
        system: params.system,
        messages: [{ role: "user", content: params.prompt }],
      });

      // Extraire uniquement les blocs texte (ignore tool_use, etc.)
      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("");

      return {
        text,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      };
    } catch (err) {
      lastError = err;

      // Ne pas retenter si erreur non-temporaire ou dernière tentative
      if (!isRetryableError(err) || attempt === API_MAX_RETRIES) {
        throw err;
      }

      const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      console.warn(
        `[claude] attempt ${attempt}/${API_MAX_RETRIES} failed — retry in ${delayMs}ms`,
        err instanceof Error ? err.message : err
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
}

// ── callClaudeJSON ────────────────────────────────────────────────────────────

/**
 * Appel API + parse JSON robuste.
 *
 * Si Claude retourne du texte autour du JSON (introduction, note, etc.),
 * safeParseJSON tente les 3 stratégies d'extraction.
 *
 * Si le JSON reste invalide, retente l'appel API une fois avec
 * une instruction renforcée dans le prompt.
 *
 * Usage : const { data, tokens } = await callClaudeJSON<PlanningOutput>(params)
 *
 * Lance une exception si JSON invalide après JSON_MAX_RETRIES tentatives.
 */
export async function callClaudeJSON<T>(
  params: ClaudeCallParams
): Promise<{ data: T; tokens: number }> {
  let currentParams = { ...params };
  let lastRawText = "";

  for (let attempt = 1; attempt <= JSON_MAX_RETRIES; attempt++) {
    const result = await callClaude(currentParams);
    lastRawText = result.text;

    const parsed = safeParseJSON<T>(result.text);

    if (parsed !== null) {
      return { data: parsed, tokens: result.totalTokens };
    }

    // JSON invalide — si on a encore une tentative, renforcer le prompt
    if (attempt < JSON_MAX_RETRIES) {
      console.warn(
        `[claude] JSON parse failed (attempt ${attempt}/${JSON_MAX_RETRIES}), retrying with stricter prompt`
      );
      currentParams = {
        ...currentParams,
        prompt:
          currentParams.prompt +
          "\n\n⚠️ IMPORTANT : ta réponse doit être UNIQUEMENT du JSON valide." +
          " Aucun texte avant, aucun texte après, aucun bloc markdown.",
      };
    }
  }

  throw new Error(
    `[claude] JSON parsing failed after ${JSON_MAX_RETRIES} attempts.\n` +
      `Raw response (first 400 chars): ${lastRawText.slice(0, 400)}`
  );
}

// ── Helpers privés ────────────────────────────────────────────────────────────

/**
 * Détermine si une erreur Anthropic est temporaire et mérite un retry.
 */
function isRetryableError(err: unknown): boolean {
  // Erreur HTTP Anthropic avec code de statut
  if (err instanceof Anthropic.APIError) {
    return RETRYABLE_STATUS_CODES.includes(err.status);
  }

  // Erreurs réseau basses (connexion reset, timeout, DNS, etc.)
  if (err instanceof Error) {
    const retryableMessages = [
      "ECONNRESET",
      "ETIMEDOUT",
      "ENOTFOUND",
      "fetch failed",
      "network error",
      "socket hang up",
    ];
    return retryableMessages.some((msg) => err.message.includes(msg));
  }

  return false;
}

/** Pause asynchrone */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
