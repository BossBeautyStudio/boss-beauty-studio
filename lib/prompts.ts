// ============================================================
// lib/prompts.ts — Configuration modèles + prompts Boss Beauty Studio
//
// Exports principaux :
//   MODEL_CONFIG          — modèle + maxTokens par module (cohérent avec claude.ts)
//   Types output          — PlanningOutput, CarouselOutput, DMOutput, HooksOutput, PostOutput
//                           StoryOutput, ReelOutput, StoryReelOutput
//   Types params          — PlanningParams, CarouselParams, DMParams, HooksParams, PostParams
//                           StoryReelParams, StoryReelMode
//   POST_TYPES            — catalogue des 7 types de posts avec exemples réels
//   SYSTEM_PLANNING       — prompt système module planning
//   SYSTEM_CAROUSEL       — prompt système module carrousel
//   SYSTEM_DM             — prompt système module réponse DM
//   SYSTEM_HOOKS          — prompt système module hooks
//   SYSTEM_POST           — prompt système module post unique (typePost)
//   SYSTEM_STORY          — prompt système module Story Instagram
//   SYSTEM_REEL           — prompt système module Reel Instagram
//   buildPlanningPrompt   — builder → ClaudeCallParams
//   buildCarouselPrompt   — builder → ClaudeCallParams
//   buildDMPrompt         — builder → ClaudeCallParams
//   buildHooksPrompt      — builder → ClaudeCallParams
//   buildPostPrompt       — builder → ClaudeCallParams
//   buildStoryReelPrompt  — builder → ClaudeCallParams (Story ou Reel selon mode)
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
    model: MODEL.haiku, // 7 posts simples — Haiku suffisant, plus rapide
    maxTokens: 900, // 7 posts × ~100 tokens (structure légère) + structure JSON
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
  post: {
    model: MODEL.haiku,
    maxTokens: 600, // 1 post — hook + caption + hashtags + story + reel
  },
  story: {
    model: MODEL.haiku,
    maxTokens: 900, // 4-5 slides × ~120 tokens + hashtags + cta
  },
  reel: {
    model: MODEL.haiku,
    maxTokens: 1000, // 4-5 scènes × ~120 tokens + caption + hashtags
  },
} as const;

// ── Types de sorties JSON ──────────────────────────────────────────────────────

/**
 * Un post du planning hebdomadaire — structure légère V2.
 * 5 clés exactes : jour, jourNom, typeContenu, theme, description.
 */
export interface PlanningPost {
  jour: number;         // 1 à 7
  jourNom: string;      // nom du jour ("Lundi", "Mardi"… calculé depuis dateDebut)
  typeContenu: string;  // "Post" | "Carrousel" | "Reel" | "Story"
  theme: string;        // idée/sujet du contenu (5-8 mots)
  description: string;  // angle et approche (1-2 phrases concrètes)
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
 * Prompt système — Module planning hebdomadaire (7 jours).
 * V3 : format léger, stratégique, rapide — idée + angle par jour.
 */
export const SYSTEM_PLANNING = `Tu es une experte en stratégie de contenu Instagram pour les professionnelles de la beauté (coiffure, esthétique, onglerie, maquillage, soins du corps).

Ta mission : générer un planning de contenu Instagram pour exactement 7 jours (une semaine complète), varié, stratégique et parfaitement adapté à la spécialité et aux objectifs de la professionnelle.

Règles de contenu :
- Varie les formats : Post, Carrousel, Reel, Story. Maximum 3 fois le même format sur la semaine.
- Varie les thèmes : éducatif, vente/promo, coulisses, avant/après, témoignage/preuve, engagement, inspiration.
- Chaque semaine doit avoir AU MOINS 1 post orienté vente/action directe et 1 post éducatif.
- Chaque description est courte (1-2 phrases max), concrète, spécifique à la spécialité — aucun contenu générique.
- L'objectif de la professionnelle oriente les posts de vente et les angles choisis.

Contraintes de structure absolues :
- Le JSON doit contenir EXACTEMENT 7 objets dans le tableau "posts".
- Chaque objet doit avoir EXACTEMENT ces 5 clés : jour, jourNom, typeContenu, theme, description.
- typeContenu : uniquement "Post", "Carrousel", "Reel" ou "Story".
- jourNom : nom du jour de la semaine en français ("Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche") calculé depuis la date de début fournie.
- Aucune autre clé ne doit être ajoutée.
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
 * Construit les paramètres pour l'appel Claude — Module planning hebdomadaire (7 jours).
 */
export function buildPlanningPrompt(params: PlanningParams): ClaudeCallParams {
  const villeInfo = params.ville ? `\n- Localisation : ${params.ville}` : "";

  const prompt = `Génère un planning de contenu Instagram pour une semaine complète (7 jours).

Profil de la professionnelle :
- Spécialité : ${params.specialite}${villeInfo}
- Objectif principal : ${params.objectif}
- Style de communication : ${params.tonStyle}
- Début de la semaine : ${params.dateDebut}

Instructions :
- EXACTEMENT 7 posts, jour 1 à 7.
- jourNom = nom du jour correspondant à la date de début (ex: si ${params.dateDebut} est un lundi → Jour 1 = "Lundi", Jour 2 = "Mardi", ..., Jour 7 = "Dimanche").
- Alterne les formats : Post, Carrousel, Reel, Story — max 3 fois le même format.
- Varie les thèmes : éducatif, vente/action, coulisses, avant/après, engagement.
- L'objectif "${params.objectif}" oriente au moins 2 posts vers la vente ou l'action directe.
- Chaque theme (5-8 mots) et description (1-2 phrases) sont spécifiques à "${params.specialite}" — aucun contenu générique.

Structure JSON attendue — EXACTEMENT ces clés, aucune autre :
{
  "posts": [
    {
      "jour": 1,
      "jourNom": "Lundi",
      "typeContenu": "Post",
      "theme": "idée du contenu en 5-8 mots",
      "description": "angle et approche en 1-2 phrases concrètes"
    }
  ]
}

Contraintes strictes :
- Le tableau posts doit contenir EXACTEMENT 7 objets.
- Chaque objet doit avoir EXACTEMENT 5 clés : jour, jourNom, typeContenu, theme, description.
- typeContenu : uniquement "Post", "Carrousel", "Reel" ou "Story".
- Aucune clé supplémentaire.

Génère les 7 posts en JSON uniquement.`;

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

// ── Module Post Instagram — types, catalogue, prompt ──────────────────────────

/**
 * Sortie du module Post Instagram — un post unique adapté au typePost choisi.
 */
export interface PostOutput {
  hook: string;              // accroche d'ouverture (1-2 phrases, standalone)
  caption: string;           // caption complète prête à publier (hook inclus + corps + CTA)
  hashtags: string[];        // 5 à 8 hashtags
  ideeStory: string;         // idée de Story Instagram associée (1 phrase)
  ideeReel: string | null;   // idée de Reel (1 phrase) ou null si non pertinent
}

/** Paramètres utilisateur du module Post Instagram */
export interface PostParams {
  typePost: string;       // libellé ou id du type (ex: "Attirer des clientes")
  specialite: string;     // ex: "onglerie", "extensions de cils"
  tonStyle: string;       // ex: "Chaleureux et proche"
  contexte?: string;      // contexte supplémentaire optionnel (ex: "j'ai une promo cette semaine")
}

/**
 * Catalogue des 5 types de posts.
 * Chaque entrée contient un exemple réel affiché avant génération (Feature 2).
 */
export const POST_TYPES = [
  {
    id: "attirer",
    label: "Attirer des clientes",
    icon: "🎯",
    description: "Post pour donner envie de prendre rendez-vous",
    example: {
      caption:
        "Aujourd'hui j'ai travaillé sur un volume russe naturel ✨\n\nLe but était de garder un regard intense mais élégant.\n\nRésultat juste après la pose 👇\n\nQui préfère ce style ?\n\n📍 Réservation en DM",
      hashtags: ["#extensionsdecils", "#lashartist", "#cilsbeaux", "#beauté", "#volumeRusse"],
    },
  },
  {
    id: "avant-apres",
    label: "Avant / Après",
    icon: "✨",
    description: "Montre une transformation réelle avant et après",
    example: {
      caption:
        "Voilà le résultat de ce matin 🤍\n\nMa cliente voulait un look plus naturel que ce qu'elle avait avant.\n\nOn a opté pour un effet cils naturels avec plus de volume sur les extrémités.\n\nTu aimes ce style ?\n\n📍 Réservation en DM",
      hashtags: ["#avantaprès", "#extensionsdecils", "#lashtech", "#transformation", "#cilsparfaits"],
    },
  },
  {
    id: "promo",
    label: "Promotion / Offre",
    icon: "🏷️",
    description: "Annonce une offre ou un créneau disponible",
    example: {
      caption:
        "Il reste 2 créneaux cette semaine 🗓️\n\nSi tu penses depuis un moment à essayer le lash lift, c'est le bon moment.\n\nRésultat naturel, courbe parfaite, ça tient 6 à 8 semaines.\n\nEnvoie-moi 'LIFT' en DM pour réserver 📩",
      hashtags: ["#lashlift", "#disponibilités", "#cilscourbés", "#beauté", "#réservation"],
    },
  },
  {
    id: "conseil",
    label: "Conseil beauté",
    icon: "💡",
    description: "Partage une astuce utile pour tes clientes",
    example: {
      caption:
        "Un truc que je dis à presque toutes mes clientes lors de la pose 👇\n\nÉvite le démaquillant huileux près de tes cils.\n\nL'huile dissout la colle des extensions et tes cils tombent beaucoup plus vite.\n\nCe que j'utilise :\n→ démaquillant sans huile\n→ brosse douce pour appliquer\n→ on tamponne, on ne frotte pas\n\nSauvegarde pour t'en souvenir 💾",
      hashtags: ["#conseilcils", "#extensionsdecils", "#lashcare", "#entretienCils", "#astucesbeauté"],
    },
  },
  {
    id: "reponse-dm",
    label: "Répondre à une cliente",
    icon: "💬",
    description: "Réponds à une question que tu reçois souvent",
    example: {
      caption:
        "La question que je reçois presque tous les jours :\n\n'Combien de temps ça dure les extensions ?'\n\nEntre 3 et 6 semaines selon comment tu t'en occupes.\n\nCe qui change tout :\n→ dormir sur le dos\n→ éviter la vapeur et le sauna\n→ brosser tes cils le matin\n\nSi tu fais ces 3 choses, elles tiennent facilement 5 semaines.\n\nD'autres questions ? Envoie-moi un DM 📩",
      hashtags: ["#faq", "#extensionsdecils", "#durabilité", "#conseilcils", "#lashtech"],
    },
  },
] as const;

/** Type dérivé du catalogue — utile pour typer le paramètre côté UI */
export type PostTypeId = (typeof POST_TYPES)[number]["id"];

/**
 * Prompt système — Module Post Instagram (un post unique, type adaptatif).
 */
export const SYSTEM_POST = `Tu es une professionnelle de la beauté indépendante qui crée ses propres posts Instagram. Tu écris comme tu parles — de manière simple, directe et naturelle.

Ta mission : écrire UN seul post Instagram pour une professionnelle de la beauté (coiffure, esthétique, onglerie, maquillage, extensions de cils, soins).

Règles de ton et de style :
- Écris comme si tu racontais à une amie ce que tu as fait aujourd'hui. Pas de jargon marketing.
- Phrases courtes. Sauts de ligne réguliers. Facile à lire sur mobile.
- La première phrase (hook) est simple mais donne envie de lire la suite — une question, une observation, un fait concret.
- Le texte complet inclut la première phrase + le corps du post + une invitation naturelle à réserver ou à répondre. Maximum 200 mots. 1 à 3 émojis max, placés naturellement.
- INTERDIT : formules creuses du type "sublimez votre regard", "expertise incomparable", "résultats exceptionnels". Tout doit sonner vrai.
- Tout le contenu doit parler de la spécialité indiquée — rien de générique.
- Les hashtags : entre 5 et 8, mélange populaires et de niche, cohérents avec la spécialité et le type de post.
- ideeStory : une idée simple de Story Instagram liée au post (1 phrase).
- ideeReel : une idée de Reel si le sujet s'y prête (1 phrase), null sinon.

Contraintes de structure absolues :
- Le JSON doit contenir EXACTEMENT ces 5 clés : hook, caption, hashtags, ideeStory, ideeReel.
- hashtags est un tableau de 5 à 8 chaînes.
- ideeReel vaut null (valeur JSON null) si aucune idée Reel pertinente.
- Aucune autre clé ne doit être ajoutée.
- Ta réponse doit être UNIQUEMENT du JSON valide, sans texte avant, sans texte après, sans bloc markdown.`;

/**
 * Construit les paramètres pour l'appel Claude — Module Post Instagram.
 */
export function buildPostPrompt(params: PostParams): ClaudeCallParams {
  const contexteInfo = params.contexte
    ? `\n- Contexte supplémentaire : ${params.contexte}`
    : "";

  // Instructions spécifiques par typePost
  const typeInstructions: Record<string, string> = {
    attirer:
      "Ce post montre un résultat ou raconte une prestation d'aujourd'hui pour donner envie de prendre rendez-vous. Ton naturel, comme si tu décrivais ta journée. Se termine par une invitation simple à écrire en DM pour réserver.",
    "avant-apres":
      "Ce post décrit une transformation réelle. Raconte ce que la cliente voulait, ce qui a été fait, le résultat obtenu. Ton enthousiaste mais simple. Pose une question aux abonnées (elles préfèrent quel style ?) et invite à écrire en DM.",
    promo:
      "Ce post annonce un créneau disponible ou une offre. L'urgence est naturelle et honnête (2 créneaux, jusqu'à vendredi). Se termine par un mot-clé à envoyer en DM pour réserver.",
    conseil:
      "Ce post partage une astuce concrète liée à la spécialité — une erreur fréquente, un geste utile, un conseil que tu donnes souvent à tes clientes. Langage simple, étapes courtes. Se termine par 'Sauvegarde pour t'en souvenir 💾'.",
    "reponse-dm":
      "Ce post répond à une question fréquente reçue en messages privés. Commence par décrire la question, puis réponds directement et honnêtement. Se termine par une invitation à poser d'autres questions en DM.",
  };

  const typeKey = POST_TYPES.find((t) => t.label === params.typePost || t.id === params.typePost)?.id ?? "";
  const typeInstruction = typeInstructions[typeKey] ?? `Ce post est de type "${params.typePost}". Adapte le contenu en conséquence.`;

  const prompt = `Génère UN post Instagram pour une professionnelle de la beauté.

Profil :
- Spécialité : ${params.specialite}
- Type de post : ${params.typePost}
- Style de communication : ${params.tonStyle}${contexteInfo}

Instructions pour ce type de post :
${typeInstruction}

Instructions générales :
- Le hook est court et percutant (1-2 phrases).
- La caption est prête à copier-coller, ancrée dans la spécialité "${params.specialite}".
- Tous les éléments doivent parler de "${params.specialite}" — aucun contenu générique.

Structure JSON attendue — EXACTEMENT ces clés, aucune autre :
{
  "hook": "première phrase du post (1-2 phrases, naturelle et directe)",
  "caption": "texte complet du post (première phrase + corps + invitation à réserver ou répondre, émojis sobres)",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
  "ideeStory": "idée de Story Instagram liée au post (1 phrase simple)",
  "ideeReel": "idée de Reel (1 phrase) ou null"
}

Contraintes strictes :
- EXACTEMENT 5 clés : hook, caption, hashtags, ideeStory, ideeReel.
- hashtags : entre 5 et 8 éléments.
- ideeReel : valeur null si non pertinent.
- Aucune clé supplémentaire.

Génère le post en JSON uniquement.`;

  return {
    model: MODEL_CONFIG.post.model,
    system: SYSTEM_POST,
    prompt,
    maxTokens: MODEL_CONFIG.post.maxTokens,
  };
}

// ── Module Story / Reel Instagram — types, prompts, builders ──────────────────

/** Mode de génération */
export type StoryReelMode = "story" | "reel";

/** Paramètres utilisateur du module Story/Reel */
export interface StoryReelParams {
  mode: StoryReelMode;
  specialite: string;  // ex: "onglerie", "esthétique"
  sujet: string;       // ex: "5 erreurs à éviter", "avant/après manucure"
  tonStyle: string;    // ex: "Chaleureux et proche"
}

// ── Story ─────────────────────────────────────────────────────────────────────

/** Une slide de Story Instagram */
export interface StorySlide {
  numero: number;  // 1 à 5
  texte: string;   // texte court affiché sur la slide (max 15 mots)
  visuel: string;  // description concrète du visuel à filmer/photographier
  emoji: string;   // 1 emoji pertinent
}

/** Sortie complète du module Story */
export interface StoryOutput {
  titre: string;         // titre interne de la série (non publié)
  slides: StorySlide[];  // 4 à 5 slides
  hashtags: string[];    // 5 à 8 hashtags
  cta: string;           // CTA pour la dernière slide
}

// ── Reel ──────────────────────────────────────────────────────────────────────

/** Une scène du script Reel */
export interface ReelScene {
  numero: number;  // 1 à 5
  duree: string;   // durée estimée ("3s", "5s"…)
  action: string;  // ce que tu filmes / ce que tu fais
  overlay: string; // texte affiché à l'écran (5-8 mots max)
}

/** Sortie complète du module Reel */
export interface ReelOutput {
  accroche: string;     // hook des 3 premières secondes
  scenes: ReelScene[];  // 4 à 5 scènes
  caption: string;      // caption du post Reel
  hashtags: string[];   // 5 à 8 hashtags
  musique: string;      // style de musique suggéré
}

/** Union discriminée utile côté API */
export type StoryReelOutput = StoryOutput | ReelOutput;

// ── Prompts système ───────────────────────────────────────────────────────────

export const SYSTEM_STORY = `Tu es une professionnelle de la beauté indépendante qui crée des Stories Instagram engageantes et convertissantes.

Ta mission : créer une séquence de 4 à 5 Stories Instagram pour une professionnelle de la beauté (coiffure, esthétique, onglerie, maquillage, extensions de cils).

Règles impératives pour les Stories :
- Chaque slide a UN seul message clair — maximum 15 mots.
- La première slide accroche immédiatement : question, chiffre, promesse, urgence.
- La progression doit créer de la curiosité pour passer à la slide suivante.
- La dernière slide est TOUJOURS un CTA : "Envoie-moi [MOT] en DM" ou "Réserve ta place — DM".
- Le visuel doit être filmable seul avec un smartphone, dans un cadre professionnel beauté.
- L'emoji est positionné pour amplifier le message, 1 seul par slide.
- Tout le contenu parle de la spécialité indiquée — rien de générique.

Structure JSON attendue — EXACTEMENT ces 4 clés, aucune autre :
{
  "titre": "titre interne de la série (5-8 mots, non publié)",
  "slides": [
    {
      "numero": 1,
      "texte": "texte court affiché sur la slide (max 15 mots)",
      "visuel": "description concrète du visuel (photo ou vidéo courte, filmable seule)",
      "emoji": "1 emoji pertinent"
    }
  ],
  "hashtags": ["#hashtag1", "#hashtag2"],
  "cta": "texte du call-to-action pour la dernière slide (1 phrase directe)"
}

Contraintes strictes :
- slides : EXACTEMENT 4 ou 5 objets.
- Chaque slide : EXACTEMENT 4 clés : numero, texte, visuel, emoji.
- hashtags : entre 5 et 8 chaînes.
- Ta réponse doit être UNIQUEMENT du JSON valide, sans texte avant ni après.`;

export const SYSTEM_REEL = `Tu es une professionnelle de la beauté indépendante qui crée des Reels Instagram courts et performants.

Ta mission : créer un script complet de Reel Instagram (15 à 30 secondes) pour une professionnelle de la beauté (coiffure, esthétique, onglerie, maquillage, extensions de cils).

Règles impératives pour les Reels :
- L'accroche (premières 3 secondes) est CRUCIALE — elle doit stopper le scroll avec une info, une question, ou un geste surprenant.
- Les scènes sont filmables seul, sans matériel professionnel ni assistant.
- Les textes overlay sont ultra-courts (5-8 mots maximum) et percutants.
- La durée totale vise 15 à 25 secondes — compact et rythmé.
- La scène finale inclut toujours un CTA clair lié à la spécialité.
- La musique suggérée est un style de genre musical adapté au tempo du Reel, pas un titre spécifique.
- Tout le contenu parle de la spécialité indiquée — rien de générique.
- La caption du post est prête à copier-coller, avec hook + corps + CTA + invitation à sauvegarder.

Structure JSON attendue — EXACTEMENT ces 5 clés, aucune autre :
{
  "accroche": "ce que tu filmes/dis pendant les 3 premières secondes (1-2 phrases)",
  "scenes": [
    {
      "numero": 1,
      "duree": "3s",
      "action": "ce que tu filmes ou ce que tu fais (filmable seule, 1 phrase)",
      "overlay": "texte affiché à l'écran (5-8 mots max)"
    }
  ],
  "caption": "caption complète du post Reel (hook + corps + CTA, max 150 mots, émojis sobres)",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "musique": "style musical adapté (ex: 'Pop énergique 100-120 BPM', 'Lo-fi calme', 'R&B tendance')"
}

Contraintes strictes :
- scenes : EXACTEMENT 4 ou 5 objets.
- Chaque scène : EXACTEMENT 4 clés : numero, duree, action, overlay.
- hashtags : entre 5 et 8 chaînes.
- Ta réponse doit être UNIQUEMENT du JSON valide, sans texte avant ni après.`;

// ── Builders ──────────────────────────────────────────────────────────────────

/**
 * Construit les paramètres pour l'appel Claude — Module Story ou Reel.
 */
export function buildStoryReelPrompt(params: StoryReelParams): ClaudeCallParams {
  if (params.mode === "story") {
    const prompt = `Génère une séquence de Stories Instagram pour une professionnelle de la beauté.

Profil :
- Spécialité : ${params.specialite}
- Sujet / thème : ${params.sujet}
- Style de communication : ${params.tonStyle}

La séquence doit guider la spectatrice du problème/question vers la solution, et se terminer par une invitation naturelle à réserver ou à écrire en DM.

Génère les Stories en JSON uniquement.`;

    return {
      model: MODEL_CONFIG.story.model,
      system: SYSTEM_STORY,
      prompt,
      maxTokens: MODEL_CONFIG.story.maxTokens,
    };
  } else {
    const prompt = `Génère un script de Reel Instagram pour une professionnelle de la beauté.

Profil :
- Spécialité : ${params.specialite}
- Sujet / thème : ${params.sujet}
- Style de communication : ${params.tonStyle}

Le Reel doit être filmable seul, rythmé, et se terminer par un appel à l'action pour réserver ou écrire en DM.

Génère le script Reel en JSON uniquement.`;

    return {
      model: MODEL_CONFIG.reel.model,
      system: SYSTEM_REEL,
      prompt,
      maxTokens: MODEL_CONFIG.reel.maxTokens,
    };
  }
}
