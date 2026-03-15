// ============================================================
// lib/prompts.ts — Configuration modèles + prompts Boss Beauty Studio
//
// Exports principaux :
//   MODEL_CONFIG        — modèle + maxTokens par module (cohérent avec claude.ts)
//   Types output        — PlanningOutput, CarouselOutput, DMOutput, HooksOutput
//   Types params        — PlanningParams, CarouselParams, DMParams, HooksParams
//   SYSTEM_PLANNING     — prompt système module planning 30 jours
//   SYSTEM_CAROUSEL     — prompt système module carrousel
//   SYSTEM_DM           — prompt système module réponse DM
//   SYSTEM_HOOKS        — prompt système module hooks
//   buildPlanningPrompt — builder → ClaudeCallParams pour callClaudeJSON
//   buildCarouselPrompt — builder → ClaudeCallParams pour callClaudeJSON
//   buildDMPrompt       — builder → ClaudeCallParams pour callClaudeJSON
//   buildHooksPrompt    — builder → ClaudeCallParams pour callClaudeJSON
// ============================================================

import { MODEL } from "./claude";
import type { ClaudeCallParams } from "./claude";

// ── Configuration modèles par module ──────────────────────────────────────────

/**
 * Paramètres modèle par module.
 * Sonnet pour la qualité (planning, carrousel) — Haiku pour la vitesse (DM, hooks).
 * Les maxTokens sont calibrés sur la taille de sortie attendue.
 */
export const MODEL_CONFIG = {
  planning: {
    model: MODEL.sonnet,
    maxTokens: 3500, // 30 posts × ~90 tokens (structure compacte) + structure JSON
  },
  carousel: {
    model: MODEL.sonnet,
    maxTokens: 2000, // ~8 slides × ~150 tokens + caption + structure
  },
  dm: {
    model: MODEL.haiku,
    maxTokens: 700, // 3 variantes × ~150 tokens + structure JSON
  },
  hooks: {
    model: MODEL.haiku,
    maxTokens: 1400, // 10 hooks × 5 clés (~100 tokens/hook) + structure JSON
  },
} as const;

// ── Types de sorties JSON ──────────────────────────────────────────────────────

/**
 * Un post du planning — structure compacte V1.
 * 6 clés exactes : jour, theme, caption, hashtags, story, reel.
 */
export interface PlanningPost {
  jour: number;       // 1 à 30
  theme: string;      // thème/sujet du post en quelques mots (ex: "Avant / Après — pose gel")
  caption: string;    // caption complète prête à publier avec émojis
  hashtags: string[]; // exactement 5 à 8 hashtags
  story: string;      // idée de Story associée au post du jour (1 phrase)
  reel: string;       // idée de Reel associée au post du jour (1 phrase)
}

/** Sortie complète du module planning */
export interface PlanningOutput {
  posts: PlanningPost[];
}

/** Une slide de carrousel */
export interface CarouselSlide {
  numero: number; // 1 = couverture
  titre: string;  // titre court de la slide (5 mots max)
  texte: string;  // contenu (2-3 phrases max)
  visuel: string; // description concrète du visuel suggéré
}

/** Sortie complète du module carrousel */
export interface CarouselOutput {
  titre: string;        // titre principal affiché sur la couverture
  slides: CarouselSlide[];
  caption: string;      // caption globale pour la publication
  hashtags: string[];   // exactement 8 à 12 hashtags
  cta: string;          // CTA final
}

/**
 * Sortie du module réponse DM — 3 variantes de ton.
 * courte   : 1-2 phrases, ultra-direct, zéro fioriture
 * standard : 2-3 phrases, équilibre chaleur + information
 * premium  : 3-4 phrases, personnalisée, valeur ajoutée, CTA doux
 */
export interface DMOutput {
  courte: string;   // réponse courte (1-2 phrases)
  standard: string; // réponse standard (2-3 phrases)
  premium: string;  // réponse premium (3-4 phrases, personnalisée)
}

/**
 * Un hook Instagram — structure enrichie V2.
 * 5 clés : numero, hook, pourquoi, utilisation, reelIdee.
 */
export interface HookItem {
  numero: number;          // 1 à 10
  hook: string;            // l'accroche elle-même, courte et percutante
  pourquoi: string;        // pourquoi ça fonctionne (10 mots max)
  utilisation: string;     // comment placer ce hook dans un post concret (15 mots max)
  reelIdee: string | null; // idée de Reel associée si pertinent, null sinon
}

/** Sortie complète du module hooks */
export interface HooksOutput {
  hooks: HookItem[]; // exactement 10
}

// ── Types des paramètres utilisateur ──────────────────────────────────────────

export interface PlanningParams {
  specialite: string; // ex: "onglerie", "coiffure", "esthétique"
  objectif: string;   // ex: "remplir mon agenda", "vendre mes soins visage"
  tonStyle: string;   // ex: "chaleureux et proche", "expert et éducatif"
  dateDebut: string;  // ex: "1er avril 2024"
  ville?: string;     // ex: "Paris 11e" — contextualise les posts locaux si fourni
}

export interface CarouselParams {
  sujet: string;        // ex: "comment préparer sa peau avant le soleil"
  specialite: string;   // ex: "esthéticienne"
  nombreSlides: number; // entre 5 et 10
  tonStyle: string;     // ex: "pédagogique et bienveillant"
  publicCible?: string; // ex: "femmes 30-45 ans" — optionnel
}

export interface DMParams {
  messageClient: string; // message reçu du client ou prospect
  specialite: string;    // ex: "coiffeuse"
  contexte?: string;     // ex: "je propose des balayages et colorations végétales"
}

export interface HooksParams {
  specialite: string;   // ex: "onglerie", "coiffure"
  typeContenu: string;  // ex: "Éducatif — conseils et astuces"
  tonStyle: string;     // ex: "Chaleureux et proche"
  publicCible?: string; // ex: "femmes 30-45 ans"
}

// ── Prompts système ────────────────────────────────────────────────────────────

/**
 * Prompt système — Module planning 30 jours.
 * V2 : contrainte avant/après + ancrage spécialité renforcé.
 */
export const SYSTEM_PLANNING = `Tu es une experte en stratégie de contenu Instagram pour les professionnelles de la beauté (coiffure, esthétique, onglerie, maquillage, soins du corps).

Ta mission : générer un planning de contenu Instagram pour exactement 30 jours, varié, engageant et parfaitement adapté à la spécialité et aux objectifs de la professionnelle.

Règles de contenu :
- Varie les thèmes sur les 30 jours : éducatif, promotionnel, coulisses, témoignage, avant/après, divertissement, inspiration. Aucune catégorie ne doit dépasser 40 % du total.
- MINIMUM 4 posts sur 30 doivent être de type "Avant / Après" — ils montrent un résultat concret avant et après une prestation liée à la spécialité. Le champ "theme" de ces posts doit commencer par "Avant / Après —".
- CHAQUE caption doit être spécifiquement ancrée dans la spécialité indiquée. Il est INTERDIT de générer du contenu générique applicable à n'importe quelle professionnelle de la beauté. Si la spécialité est "onglerie", toutes les captions parlent d'ongles, de poses, de gels, de vernis — jamais d'un autre domaine.
- La caption est complète et prête à publier : émojis adaptés, sauts de ligne aérés, contenu de valeur. Max 5 phrases. CTA naturel inclus (ex: "Sauvegarde 💾", "Dis-moi en commentaire", "Envoie-moi 'INFO' en DM").
- Les hashtags : entre 5 et 8 par post, mélange populaires et de niche, cohérents avec la spécialité et le thème.
- La story : une idée concrète et réalisable de Story Instagram liée au post du jour, spécifique à la spécialité (ex: "Sondage : tu préfères gel ou vernis ?").
- Le reel : une idée concrète et réalisable de Reel lié au post du jour, spécifique à la spécialité (ex: "Timelapse d'une pose d'ongles en 30 secondes").

Contraintes de structure absolues :
- Le JSON doit contenir EXACTEMENT 30 objets dans le tableau "posts".
- Chaque objet doit avoir EXACTEMENT ces 6 clés : jour, theme, caption, hashtags, story, reel.
- Aucune autre clé ne doit être ajoutée.
- hashtags doit être un tableau de 5 à 8 chaînes de caractères.
- Ta réponse doit être UNIQUEMENT du JSON valide, sans texte avant, sans texte après, sans bloc markdown.`;

/**
 * Prompt système — Module carrousel.
 */
export const SYSTEM_CAROUSEL = `Tu es une experte en création de carrousels Instagram pour les professionnelles de la beauté.

Ta mission : créer des carrousels pédagogiques, visuellement cohérents, hautement saveables et partageables, qui positionnent la professionnelle comme une référence dans sa spécialité.

Règles de structure :
- Slide 1 (couverture) : accroche forte + promesse claire du contenu. C'est la slide la plus importante. Le titre doit donner envie de swiper immédiatement.
- Slides intermédiaires : une idée principale par slide, texte court (2-3 phrases max), progression logique : problème → solution → résultat, ou étape 1 → 2 → 3, ou mythe → vérité.
- Dernière slide : récapitulatif ou CTA fort (réserver, envoyer un DM, sauvegarder).

Règles de rédaction :
- Titres de slides : courts, percutants, 5 mots max.
- Texte : concret, actionnable, sans jargon inaccessible.
- Visuel suggéré : description précise et réalisable par une indépendante (photo produit, démonstration main, avant/après, selfie professionnel, flat lay).
- La progression doit créer un effet "j'ai appris quelque chose" à la dernière slide.

Contraintes de structure absolues :
- Le tableau "slides" doit contenir EXACTEMENT le nombre de slides demandé dans le prompt utilisateur, ni plus ni moins.
- Chaque slide doit avoir EXACTEMENT ces 4 clés : numero, titre, texte, visuel.
- hashtags doit être un tableau de 8 à 12 chaînes de caractères.
- Aucune autre clé ne doit être ajoutée à aucun niveau du JSON.
- Ta réponse doit être UNIQUEMENT du JSON valide, sans texte avant, sans texte après, sans bloc markdown.`;

/**
 * Prompt système — Module réponse DM.
 */
export const SYSTEM_DM = `Tu es une assistante experte en relation client pour les professionnelles de la beauté.

Ta mission : rédiger 3 variantes de réponse Instagram DM, du plus court au plus personnalisé, pour aider la professionnelle à choisir le ton adapté à chaque client.

Définition des 3 variantes :
- courte   : 1 à 2 phrases. Ultra-direct, zéro fioriture. Pour les DM rapides ou les clients qui vont droit au but.
- standard : 2 à 3 phrases. Équilibre entre chaleur et information. Le ton du quotidien.
- premium  : 3 à 4 phrases. Personnalisée, valeur ajoutée visible, CTA doux inclus. Pour les prospects importants ou les clients fidèles.

Règles communes aux 3 variantes :
- Ton humain, naturel, comme si la professionnelle répondait elle-même.
- Réponse directe à ce qui est demandé.
- Jamais de formules robotiques ("Chère cliente,", "N'hésitez pas à nous contacter").
- Français courant, adapté aux DM Instagram. Émojis sobres (0-2 par réponse).
- Adapté à la spécialité de la professionnelle.

Contraintes de structure absolues :
- Le JSON doit contenir EXACTEMENT ces 3 clés : courte, standard, premium.
- Aucune autre clé ne doit être ajoutée.
- Ta réponse doit être UNIQUEMENT du JSON valide, sans texte avant, sans texte après, sans bloc markdown.`;

/**
 * Prompt système — Module hooks Instagram.
 * Structure enrichie V2 : numero, hook, pourquoi, utilisation, reelIdee.
 */
export const SYSTEM_HOOKS = `Tu es une experte en copywriting Instagram pour les professionnelles de la beauté (coiffure, esthétique, onglerie, maquillage, soins du corps).

Ta mission : générer exactement 10 accroches (hooks) Instagram percutantes, adaptées à la spécialité et au type de contenu demandé.

Qu'est-ce qu'un bon hook Instagram :
- C'est la première phrase du post — celle qui décide si on lit ou si on scroll
- Elle est courte : 1 à 2 phrases max, 15 mots max par phrase
- Elle crée de la curiosité, de l'identification ou de l'émotion
- Elle ne dévoile pas tout — elle donne envie de lire la suite

Formats d'accroches qui fonctionnent :
- La question qui fait mal : "Tu fais encore cette erreur avec tes ongles ?"
- La promesse chiffrée : "3 choses que je dis à toutes mes nouvelles clientes"
- Le secret révélé : "Ce que personne ne te dit sur l'extension de cils"
- L'identification : "Si tu en as marre de chercher une spécialiste qui te comprend vraiment…"
- La contradiction : "Arrête de dépenser en soins si tu ne fais pas ça d'abord"
- La statistique : "80 % de mes clientes font cette erreur sans le savoir"
- L'interpellation directe : "Attention à toutes celles qui utilisent encore du vernis classique"

Définition des 5 clés de chaque hook :
- hook        : l'accroche percutante prête à utiliser (1-2 phrases, 15 mots max par phrase)
- pourquoi    : pourquoi ce hook stoppe le scroll (10 mots max)
- utilisation : comment placer ce hook dans un post (15 mots max). Ex: "Place en ouverture d'un post éducatif sur l'entretien des ongles"
- reelIdee    : une idée de Reel associée si pertinent (1 phrase), ou null si non pertinent

Contraintes de structure absolues :
- Le JSON doit contenir EXACTEMENT 10 objets dans le tableau "hooks".
- Chaque objet doit avoir EXACTEMENT ces 5 clés : numero, hook, pourquoi, utilisation, reelIdee.
- "reelIdee" vaut null (valeur JSON null, pas la chaîne "null") si aucune idée Reel pertinente.
- Ta réponse doit être UNIQUEMENT du JSON valide, sans texte avant, sans texte après, sans bloc markdown.`;

// ── Builders de prompts ────────────────────────────────────────────────────────

/**
 * Construit les paramètres pour l'appel Claude — Module planning 30 jours.
 */
export function buildPlanningPrompt(params: PlanningParams): ClaudeCallParams {
  const villeInfo = params.ville ? `\n- Localisation : ${params.ville}` : "";

  const prompt = `Génère un planning de contenu Instagram pour exactement 30 jours.

Profil de la professionnelle :
- Spécialité : ${params.specialite}${villeInfo}
- Objectif principal : ${params.objectif}
- Style de communication : ${params.tonStyle}
- Début du planning : ${params.dateDebut}

Instructions :
- EXACTEMENT 30 posts, jour 1 à 30, sans exception.
- Minimum 4 posts de type "Avant / Après" avec résultat concret lié à la spécialité "${params.specialite}". Le champ "theme" de ces posts commence par "Avant / Après —".
- Chaque post doit être UNIQUEMENT adapté à la spécialité "${params.specialite}" — aucun contenu générique non lié à cette spécialité.
- L'objectif "${params.objectif}" oriente les posts promotionnels et les CTA intégrés aux captions.
- Varie les formats : éducatif, avant/après, coulisses, promotion, témoignage, inspiration.

Structure JSON attendue — EXACTEMENT ces clés, aucune autre :
{
  "posts": [
    {
      "jour": 1,
      "theme": "thème ou sujet du post en quelques mots",
      "caption": "caption complète prête à publier avec émojis et CTA inclus",
      "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
      "story": "idée de Story Instagram liée au post du jour (1 phrase)",
      "reel": "idée de Reel lié au post du jour (1 phrase)"
    }
  ]
}

Contraintes strictes :
- Le tableau posts doit contenir EXACTEMENT 30 objets.
- Chaque objet doit avoir EXACTEMENT 6 clés : jour, theme, caption, hashtags, story, reel.
- hashtags doit contenir entre 5 et 8 éléments.
- Aucune clé supplémentaire.

Génère les 30 posts en JSON uniquement.`;

  return {
    model: MODEL_CONFIG.planning.model,
    system: SYSTEM_PLANNING,
    prompt,
    maxTokens: MODEL_CONFIG.planning.maxTokens,
  };
}

/**
 * Construit les paramètres pour l'appel Claude — Module carrousel.
 */
export function buildCarouselPrompt(params: CarouselParams): ClaudeCallParams {
  const publicInfo = params.publicCible
    ? `\n- Public cible : ${params.publicCible}`
    : "";

  const prompt = `Crée un carrousel Instagram pour une professionnelle de la beauté.

Paramètres :
- Sujet : ${params.sujet}
- Spécialité : ${params.specialite}
- Nombre de slides : ${params.nombreSlides} (slide 1 = couverture, slide ${params.nombreSlides} = conclusion/CTA)
- Style de communication : ${params.tonStyle}${publicInfo}

Instructions :
- Slide 1 : couverture avec accroche irrésistible. Titre = promesse claire du contenu.
- Slides 2 à ${params.nombreSlides - 1} : contenu progressif, une idée par slide.
- Slide ${params.nombreSlides} : conclusion ou CTA fort.
- Chaque "visuel" décrit ce que la professionnelle doit photographier ou filmer.

Structure JSON attendue — EXACTEMENT ces clés, aucune autre :
{
  "titre": "titre principal affiché sur la couverture",
  "slides": [
    {
      "numero": 1,
      "titre": "titre court de la slide (5 mots max)",
      "texte": "contenu de la slide (2-3 phrases max)",
      "visuel": "description précise du visuel à créer"
    }
  ],
  "caption": "caption complète pour publier le carrousel avec émojis",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "cta": "call-to-action final"
}

Contraintes strictes :
- Le tableau slides doit contenir EXACTEMENT ${params.nombreSlides} objets, ni plus ni moins.
- Chaque slide doit avoir EXACTEMENT 4 clés : numero, titre, texte, visuel.
- hashtags doit contenir entre 8 et 12 éléments.
- Aucune clé supplémentaire à aucun niveau.

Génère le carrousel en JSON uniquement.`;

  return {
    model: MODEL_CONFIG.carousel.model,
    system: SYSTEM_CAROUSEL,
    prompt,
    maxTokens: MODEL_CONFIG.carousel.maxTokens,
  };
}

/**
 * Construit les paramètres pour l'appel Claude — Module réponse DM.
 */
export function buildDMPrompt(params: DMParams): ClaudeCallParams {
  const contexteInfo = params.contexte
    ? `\n- Contexte : ${params.contexte}`
    : "";

  const prompt = `Rédige 3 variantes de réponse Instagram DM pour une professionnelle de la beauté.

Message reçu :
"${params.messageClient}"

Profil de la professionnelle :
- Spécialité : ${params.specialite}${contexteInfo}

Définition des 3 variantes :
- courte   : 1-2 phrases, ultra-direct, zéro fioriture
- standard : 2-3 phrases, chaleur + information, ton du quotidien
- premium  : 3-4 phrases, personnalisée, valeur ajoutée, CTA doux

Instructions :
- Les 3 variantes doivent répondre au même message mais avec un ton progressivement plus élaboré.
- Adapte chaque variante à la spécialité "${params.specialite}".

Structure JSON attendue — EXACTEMENT ces clés, aucune autre :
{
  "courte": "réponse courte prête à envoyer",
  "standard": "réponse standard prête à envoyer",
  "premium": "réponse premium prête à envoyer"
}

Contraintes strictes :
- Le JSON doit contenir EXACTEMENT 3 clés : courte, standard, premium.
- Aucune autre clé.

Génère les 3 variantes en JSON uniquement.`;

  return {
    model: MODEL_CONFIG.dm.model,
    system: SYSTEM_DM,
    prompt,
    maxTokens: MODEL_CONFIG.dm.maxTokens,
  };
}

/**
 * Construit les paramètres pour l'appel Claude — Module hooks Instagram.
 * Structure enrichie V2 : numero, hook, pourquoi, utilisation, reelIdee.
 */
export function buildHooksPrompt(params: HooksParams): ClaudeCallParams {
  const publicInfo = params.publicCible
    ? `\n- Public cible : ${params.publicCible}`
    : "";

  const prompt = `Génère exactement 10 accroches Instagram pour une professionnelle de la beauté.

Profil de la professionnelle :
- Spécialité : ${params.specialite}
- Type de contenu : ${params.typeContenu}
- Style de communication : ${params.tonStyle}${publicInfo}

Instructions :
- Les 10 hooks doivent être variés : utilise des formats différents (question, statistique, promesse, contradiction, identification, secret révélé, interpellation).
- Chaque hook doit être court : 1 à 2 phrases maximum, 15 mots max par phrase.
- Adapte chaque hook à la spécialité "${params.specialite}" et au type de contenu "${params.typeContenu}".
- "pourquoi" : explique en max 10 mots pourquoi ce hook stoppe le scroll.
- "utilisation" : une phrase concrète sur comment placer ce hook dans un post (15 mots max). Ex: "Place en ouverture d'un post conseils sur l'entretien des ongles."
- "reelIdee" : une idée de Reel courte associée à ce hook si pertinent (1 phrase), null (valeur JSON) sinon.

Structure JSON attendue — EXACTEMENT ces clés, aucune autre :
{
  "hooks": [
    {
      "numero": 1,
      "hook": "l'accroche percutante prête à utiliser",
      "pourquoi": "raison courte (10 mots max)",
      "utilisation": "comment placer ce hook dans un post (15 mots max)",
      "reelIdee": "idée de Reel associée (1 phrase) ou null"
    }
  ]
}

Contraintes strictes :
- Le tableau hooks doit contenir EXACTEMENT 10 objets, ni plus ni moins.
- Chaque objet doit avoir EXACTEMENT 5 clés : numero, hook, pourquoi, utilisation, reelIdee.
- "reelIdee" doit être null (valeur JSON null, pas la chaîne "null") si non pertinent.
- Aucune clé supplémentaire.

Génère les 10 hooks en JSON uniquement.`;

  return {
    model: MODEL_CONFIG.hooks.model,
    system: SYSTEM_HOOKS,
    prompt,
    maxTokens: MODEL_CONFIG.hooks.maxTokens,
  };
}
