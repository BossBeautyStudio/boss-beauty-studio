// ============================================================
// lib/mock.ts — Mode test sans consommation de crédits Anthropic
//
// Usage :
//   Dans .env.local : MOCK_GENERATION=true
//   Les routes /api/generate/* retournent des données fictives cohérentes
//   tout en conservant le flow complet : assertQuota, incrementQuota, saveGeneration.
//
// Exports :
//   isMockMode()           — true si MOCK_GENERATION=true dans l'env
//   getMockPlanning()      — PlanningOutput fictif (30 posts)
//   getMockCarousel(n)     — CarouselOutput fictif (n slides)
//   getMockDM()            — DMOutput fictif (3 variantes)
//   MOCK_TOKENS_USED       — valeur constante simulée pour tokensUsed
// ============================================================

import type {
  PlanningOutput,
  CarouselOutput,
  DMOutput,
  HooksOutput,
  PostOutput,
  StoryOutput,
  ReelOutput,
} from "./prompts";

// ── Détection du mode mock ─────────────────────────────────────────────────────

/**
 * Retourne true si MOCK_GENERATION=true dans les variables d'environnement.
 * Insensible à la casse ("true", "True", "TRUE" → true).
 */
export function isMockMode(): boolean {
  const mock = process.env.MOCK_GENERATION?.toLowerCase() === "true";
  if (mock) {
    console.warn("⚠️  MOCK GENERATION MODE ACTIVE — aucun crédit Anthropic consommé");
  }
  return mock;
}

/** Nombre de tokens simulé pour saveGeneration en mode mock. */
export const MOCK_TOKENS_USED = 0;

// ── Mock Planning ──────────────────────────────────────────────────────────────

/** Retourne un PlanningOutput fictif avec exactement 7 posts (planning hebdomadaire). */
export function getMockPlanning(): PlanningOutput {
  return {
    posts: [
      {
        jour: 1,
        jourNom: "Lundi",
        typeContenu: "Post",
        theme: "3 erreurs qui abîment tes ongles sans le savoir",
        description: "Post éducatif avec 3 astuces concrètes d'entretien. Ton bienveillant, sauvegarde encouragée.",
      },
      {
        jour: 2,
        jourNom: "Mardi",
        typeContenu: "Story",
        theme: "Sondage : gel ou semi-permanent ?",
        description: "Story interactive avec sondage pour engager ta communauté et comprendre ses préférences.",
      },
      {
        jour: 3,
        jourNom: "Mercredi",
        typeContenu: "Carrousel",
        theme: "Avant / Après — pose complète résultat client",
        description: "Carrousel comparaison avant/après en 3-4 slides. Montre le résultat d'une vraie prestation.",
      },
      {
        jour: 4,
        jourNom: "Jeudi",
        typeContenu: "Reel",
        theme: "Coulisses d'une journée en salon",
        description: "Reel ambiance avec musique tendance. Montre ton espace, tes outils et ton quotidien.",
      },
      {
        jour: 5,
        jourNom: "Vendredi",
        typeContenu: "Post",
        theme: "Offre spéciale — places disponibles cette semaine",
        description: "Post de vente directe avec urgence douce. CTA clair vers les DM pour réserver.",
      },
      {
        jour: 6,
        jourNom: "Samedi",
        typeContenu: "Story",
        theme: "Quiz : tu connais les soins de ta spécialité ?",
        description: "Story quiz en plusieurs questions pour éduquer et divertir. Partage des réponses en stories suivantes.",
      },
      {
        jour: 7,
        jourNom: "Dimanche",
        typeContenu: "Post",
        theme: "Citation inspiration — prendre soin de soi",
        description: "Post inspiration avec citation visuelle. Ton chaleureux, invite à commenter leur rituel du dimanche.",
      },
    ],
  };
}

// ── Mock Carousel ──────────────────────────────────────────────────────────────

/**
 * Retourne un CarouselOutput fictif.
 * Le nombre de slides s'adapte au paramètre `nombreSlides` (5 à 10).
 * On utilise un pool de 10 slides et on en prend les `n` premières.
 */
export function getMockCarousel(nombreSlides: number): CarouselOutput {
  const allSlides = [
    {
      numero: 1,
      titre: "5 erreurs qui abîment ta peau",
      texte:
        "Tu fais peut-être ces erreurs chaque jour sans le savoir. Dans ce carrousel, je te montre comment les éviter pour une peau visiblement plus belle en 2 semaines.",
      visuel:
        "Photo de toi face caméra, peau naturelle, regard direct, fond neutre. Titre en surimpression grand format.",
    },
    {
      numero: 2,
      titre: "Erreur n°1 : lingettes démaquillantes",
      texte:
        "Les lingettes irritent, micro-déchirent et laissent des résidus. Résultat : pores bouchés et sensibilité. Remplace-les par une huile nettoyante et un gel doux.",
      visuel:
        "Flat lay : lingette vs flacon d'huile nettoyante, fond blanc, étiquette 'NON' vs 'OUI'.",
    },
    {
      numero: 3,
      titre: "Erreur n°2 : SPF uniquement l'été",
      texte:
        "Les UVA traversent les nuages et les vitres. Ils vieillissent la peau 365 jours par an. L'SPF quotidien est l'anti-âge le plus efficace qui existe — et le moins cher.",
      visuel:
        "Photo en extérieur par temps nuageux, crème solaire en main, sourire naturel.",
    },
    {
      numero: 4,
      titre: "Erreur n°3 : frotter les yeux",
      texte:
        "La peau autour des yeux est 10× plus fine que le reste du visage. Frotter = microdéchirures + cernes aggravés + rides prématurées. On tapote toujours, jamais on ne frotte.",
      visuel:
        "Gros plan main qui tapote doucement le contour de l'œil avec l'annulaire.",
    },
    {
      numero: 5,
      titre: "Erreur n°4 : changer de produits trop vite",
      texte:
        "Un soin met 4 à 6 semaines pour montrer ses effets. Si tu changes tous les 15 jours, tu ne vois jamais de résultat — et tu dépenses inutilement. Patience = clé.",
      visuel:
        "Flat lay de 2-3 produits bien alignés avec calendrier ou journal indiquant '4 semaines'.",
    },
    {
      numero: 6,
      titre: "Erreur n°5 : sauter la crème hydratante",
      texte:
        "Même la peau grasse a besoin d'hydratation. Sans elle, elle compense en produisant plus de sébum. Résultat : plus de brillances, plus de boutons. Paradoxal mais réel.",
      visuel:
        "Photo split : peau mate et lumineuse vs peau brillante et terne, avant/après.",
    },
    {
      numero: 7,
      titre: "Bonus : la règle des 4 semaines",
      texte:
        "Donne 4 semaines à chaque nouveau produit. Note tes observations. Si aucun changement : tu peux passer à autre chose. Si amélioration : garde-le et ajoute un seul élément à la fois.",
      visuel:
        "Carnet ouvert sur fond bois, stylo, petits pots de soin alignés, lumière naturelle douce.",
    },
    {
      numero: 8,
      titre: "Et si on allait plus loin ?",
      texte:
        "Tu veux un protocole sur-mesure adapté à ton type de peau ? Je fais des bilans personnalisés en cabine. Places limitées ce mois-ci.",
      visuel:
        "Photo de toi en cabine, sourire accueillant, espace lumineux et propre en arrière-plan.",
    },
    {
      numero: 9,
      titre: "Ce que mes clientes disent",
      texte:
        "\"En 3 semaines de protocole, ma peau a complètement changé. Je ne me suis jamais sentie aussi bien dans ma peau.\" — Sophie, 38 ans. Tu veux le même résultat ?",
      visuel:
        "Capture d'écran du témoignage (anonymisé visuellement) sur fond pastel.",
    },
    {
      numero: 10,
      titre: "Réserve ton bilan peau",
      texte:
        "Envoie-moi 'BILAN' en DM et je t'explique tout. Premier rendez-vous offert pour découvrir mon approche. Parce que ta peau mérite un vrai protocole adapté, pas du hasard.",
      visuel:
        "Photo de toi souriante, main qui pointe vers la caméra, texte CTA en surimpression.",
    },
  ];

  const slides = allSlides.slice(0, nombreSlides).map((s, i) => ({
    ...s,
    numero: i + 1,
  }));

  return {
    titre: "5 erreurs qui abîment ta peau (et comment les corriger)",
    slides,
    caption:
      "Tu sabotes peut-être ta peau sans le savoir 😬\n\nSwipe pour découvrir les 5 erreurs les plus courantes — et les solutions concrètes pour y remédier.\n\nSauvegarde ce carrousel 💾 et partage-le à une amie qui en a besoin !",
    hashtags: [
      "#erreursbeauté",
      "#conseilpeau",
      "#skincaretips",
      "#routinepeau",
      "#soinsvisage",
      "#peauparfaite",
      "#astucesbeauté",
      "#beauténaturelle",
      "#soinsquotidiens",
      "#expertepeau",
    ],
    cta: "Envoie-moi 'BILAN' en DM pour un protocole personnalisé 📩",
  };
}

// ── Mock DM ────────────────────────────────────────────────────────────────────

/** Retourne un DMOutput fictif avec 3 variantes cohérentes. */
export function getMockDM(): DMOutput {
  return {
    courte:
      "Oui, j'ai des disponibilités cette semaine ! Envoie-moi tes disponibilités en DM et je te trouve un créneau 😊",
    standard:
      "Bonjour ! Oui bien sûr, il me reste quelques créneaux cette semaine. Tu es disponible plutôt en matinée ou l'après-midi ? Je t'envoie les horaires dès que tu me le dis 🌸",
    premium:
      "Bonjour ! Super contente d'avoir de tes nouvelles 😊 Il me reste effectivement des disponibilités cette semaine, notamment jeudi matin et vendredi après-midi. Pour ce type de soin, je prévois environ 1h30 pour qu'on soit tranquilles et que le résultat soit vraiment optimal. Tu veux qu'on réserve un de ces créneaux ? Je t'envoie tous les détails dès confirmation 🌿",
  };
}

// ── Mock Post ──────────────────────────────────────────────────────────────────

/**
 * Retourne un PostOutput fictif adapté au type de post demandé.
 * Utilisé en mode MOCK_GENERATION=true et pour les générations gratuites.
 */
export function getMockPost(typePost: string): PostOutput {
  const type = typePost.toLowerCase();

  if (type.includes("avant") || type.includes("apres") || type.includes("après")) {
    return {
      hook: "Aujourd'hui j'ai transformé les cils de ma cliente ✨",
      caption:
        "Aujourd'hui j'ai transformé les cils de ma cliente ✨\n\nElle voulait un résultat naturel mais plus intense.\n\nRésultat : volume russe dense, courbe parfaite, regard ouvert.\n\nVous préférez volume russe ou classique ?\n\n📍 Réservation en DM",
      hashtags: ["#avantaprès", "#extensionsdecils", "#lashtech", "#transformation", "#cilsparfaits"],
      ideeStory: "Révèle le résultat progressivement avec un slider avant/après.",
      ideeReel: "Transition avant/après en Reel avec effet split-screen et texte 'sans filtre'.",
    };
  }

  if (type.includes("promo") || type.includes("offre")) {
    return {
      hook: "Il reste 2 créneaux disponibles cette semaine 🗓️",
      caption:
        "Il reste 2 créneaux disponibles cette semaine 🗓️\n\nSi tu penses depuis quelques temps à prendre soin de tes cils, c'est le moment.\n\nPose complète · Résultat immédiat · Tient 4 à 6 semaines.\n\nEnvoie-moi 'RDV' en DM pour réserver ta place 📩\n\nPlaces vraiment limitées cette semaine.",
      hashtags: ["#disponibilités", "#extensionsdecils", "#réservation", "#cilsbeaux", "#beauté"],
      ideeStory: "Compte à rebours : créneaux encore disponibles cette semaine.",
      ideeReel: null,
    };
  }

  if (type.includes("conseil") || type.includes("beauté")) {
    return {
      hook: "Tu fais peut-être cette erreur avec tes extensions sans le savoir 👀",
      caption:
        "Tu fais peut-être cette erreur avec tes extensions sans le savoir 👀\n\nUtiliser un démaquillant huileux près de tes cils.\n\nL'huile dissout la colle des extensions. Résultat : tes cils tombent en moins d'une semaine.\n\nCe que je recommande :\n→ Démaquillant sans huile et sans alcool\n→ Appliquer avec une brosse douce\n→ Sécher en tamponnant — jamais en frottant\n\nSauvegarde ce post 💾 pour t'en souvenir !",
      hashtags: ["#conseilcils", "#extensionsdecils", "#lashcare", "#entretienCils", "#astucesbeauté"],
      ideeStory: "Quiz : tu utilises quoi comme démaquillant en ce moment ?",
      ideeReel: "Démontre la différence entre un démaquillant huileux et un démaquillant adapté en 20 secondes.",
    };
  }

  if (type.includes("dm") || type.includes("réponse") || type.includes("reponse")) {
    return {
      hook: "La question que je reçois le plus souvent en DM :",
      caption:
        "La question que je reçois le plus souvent en DM :\n\n'Combien de temps durent les extensions ?'\n\nLa réponse honnête : entre 3 et 6 semaines selon tes habitudes.\n\nCe qui fait vraiment la différence :\n→ tu dors sur le dos\n→ tu évites la vapeur et le sauna\n→ tu brosses tes cils chaque matin\n\nSi tu coches ces 3 cases, tes extensions tiennent facilement 5 à 6 semaines.\n\nD'autres questions ? Envoie-moi un DM 📩",
      hashtags: ["#faq", "#extensionsdecils", "#durabilité", "#conseilcils", "#lashtech"],
      ideeStory: "Sondage : tu dors sur le dos ou sur le ventre ?",
      ideeReel: "Réponds à la question en vidéo de 30 secondes, ton naturel et direct.",
    };
  }

  // Défaut : type "attirer des clientes"
  return {
    hook: "Aujourd'hui j'ai travaillé sur un volume russe naturel ✨",
    caption:
      "Aujourd'hui j'ai travaillé sur un volume russe naturel ✨\n\nLe but était de garder un regard intense mais élégant.\n\nRésultat juste après la pose 👇\n\nQui préfère ce style ?\n\n📍 Réservation en DM",
    hashtags: ["#extensionsdecils", "#lashartist", "#lashtech", "#beauté", "#volumeRusse"],
    ideeStory: "Montre le résultat en story avec un slider avant/après.",
    ideeReel: "Timelapse de la pose en 30 secondes avec le résultat final.",
  };
}

// ── Mock Hooks ─────────────────────────────────────────────────────────────────

/** Retourne un HooksOutput fictif avec exactement 10 hooks. */
export function getMockHooks(): HooksOutput {
  return {
    hooks: [
      {
        numero: 1,
        hook: "Tu fais encore cette erreur avec ta peau sans le savoir ?",
        pourquoi: "La question crée une peur douce et pousse à lire",
        utilisation: "Place en ouverture d'un post éducatif sur les erreurs de routine soin",
        reelIdee: "Montre 3 erreurs fréquentes en 30 secondes avec correction immédiate",
      },
      {
        numero: 2,
        hook: "3 choses que je dis à toutes mes nouvelles clientes avant de commencer.",
        pourquoi: "Le chiffre + la promesse d'un secret pro captivent",
        utilisation: "Idéal en ouverture d'un post coulisses ou pédagogique",
        reelIdee: null,
      },
      {
        numero: 3,
        hook: "Arrête de dépenser en crèmes si tu ne fais pas ça d'abord.",
        pourquoi: "La contradiction + l'économie d'argent stoppent le scroll",
        utilisation: "Place avant un post conseil sur la routine de base à adopter",
        reelIdee: "Démontre le geste clé en 15 secondes avant d'appliquer un soin",
      },
      {
        numero: 4,
        hook: "Ce que personne ne te dit sur le soin que tout le monde commande.",
        pourquoi: "Le mystère + l'exclusivité déclenchent la curiosité",
        utilisation: "En tête d'un post de démystification sur ta prestation phare",
        reelIdee: null,
      },
      {
        numero: 5,
        hook: "80 % de mes clientes arrivent en faisant cette erreur. Et toi ?",
        pourquoi: "La statistique + l'interpellation personnelle créent l'identification",
        utilisation: "Ouvre un post avant/après ou un post pédagogique axé résultats",
        reelIdee: "Avant/après en split-screen avec la correction de l'erreur",
      },
      {
        numero: 6,
        hook: "Si tu en as marre de ne pas voir de résultats malgré tous tes efforts…",
        pourquoi: "Identification à une frustration commune = connexion immédiate",
        utilisation: "Place avant un post témoignage ou une présentation de prestation",
        reelIdee: null,
      },
      {
        numero: 7,
        hook: "Le vrai secret d'une peau éclatante ? Ce n'est pas le produit que tu crois.",
        pourquoi: "Promesse de révélation qui contredit une idée reçue",
        utilisation: "Idéal en tête d'un carrousel éducatif ou d'un post conseil",
        reelIdee: "Révèle le geste ou produit surprise en 20 secondes façon 'secret dévoilé'",
      },
      {
        numero: 8,
        hook: "Avant/après : 3 séances. Pas de filtre. Pas de retouche.",
        pourquoi: "La preuve brute + l'honnêteté décuplent la crédibilité",
        utilisation: "Ouvre un post avant/après avec photos de résultats réels",
        reelIdee: "Transition avant/après en Reel avec texte '3 séances, zéro filtre'",
      },
      {
        numero: 9,
        hook: "Je ne recommande plus ce soin à mes clientes. Voilà pourquoi.",
        pourquoi: "Le retournement de situation force à lire la suite",
        utilisation: "Lance un post pédagogique qui explique une évolution de pratique",
        reelIdee: null,
      },
      {
        numero: 10,
        hook: "Une cliente m'a dit quelque chose qui m'a arrêtée net en plein soin.",
        pourquoi: "La narration mystérieuse à la 1ère personne capte l'attention",
        utilisation: "Ouvre un post témoignage ou une anecdote professionnelle marquante",
        reelIdee: "Raconte l'anecdote en voix off sur des images de ton espace de travail",
      },
    ],
  };
}

// ── Mock Story ─────────────────────────────────────────────────────────────────

/** Retourne un StoryOutput fictif pour l'essai gratuit / mode mock. */
export function getMockStory(): StoryOutput {
  return {
    titre: "3 gestes qui changent tout pour tes ongles",
    slides: [
      {
        numero: 1,
        texte: "Tu casses tes ongles tout le temps ? Lis ça 👇",
        visuel: "Gros plan sur tes mains, regard questionnant vers la caméra",
        emoji: "🤔",
      },
      {
        numero: 2,
        texte: "Erreur n°1 — Limer dans les deux sens",
        visuel: "Démonstration du mauvais geste avec une lime, tu secoues la tête",
        emoji: "❌",
      },
      {
        numero: 3,
        texte: "La bonne technique : toujours dans un seul sens",
        visuel: "Démonstration du bon geste, limage doux dans un sens, tu souris",
        emoji: "✅",
      },
      {
        numero: 4,
        texte: "Résultat : ongles plus solides, moins de casse",
        visuel: "Tes mains soignées posées sur fond neutre, ongles bien visibles",
        emoji: "💅",
      },
      {
        numero: 5,
        texte: "Tu veux des ongles en béton ? Envoie-moi 'ONGLES' en DM 📩",
        visuel: "Toi souriante face caméra, fond de ta couleur de marque",
        emoji: "📩",
      },
    ],
    hashtags: [
      "#onglerie",
      "#astuceongles",
      "#onglesnatural",
      "#nailcare",
      "#beaute",
      "#prothesisteongulaire",
    ],
    cta: "Envoie-moi 'ONGLES' en DM pour réserver ta séance 💌",
  };
}

// ── Mock Reel ──────────────────────────────────────────────────────────────────

/** Retourne un ReelOutput fictif pour l'essai gratuit / mode mock. */
export function getMockReel(): ReelOutput {
  return {
    accroche:
      "Si tu fais ça chaque jour, tes ongles cassent forcément — et je vais te montrer pourquoi 🚨",
    scenes: [
      {
        numero: 1,
        duree: "3s",
        action:
          "Gros plan sur tes mains, tu poses un flacon de dissolvant agressif et tu fais signe 'non'",
        overlay: "L'erreur que TOUT LE MONDE fait 👇",
      },
      {
        numero: 2,
        duree: "5s",
        action:
          "Tu montres le geste incorrect (limage en va-et-vient rapide) avec expression choquée",
        overlay: "❌ Ne JAMAIS limer en va-et-vient",
      },
      {
        numero: 3,
        duree: "5s",
        action:
          "Tu montres le bon geste (lime dans un seul sens, doux) avec sourire approbateur",
        overlay: "✅ Toujours dans UN seul sens",
      },
      {
        numero: 4,
        duree: "5s",
        action: "Tu présentes tes ongles parfaits face caméra, tu rayonnes",
        overlay: "Résultat : ongles solides, zéro casse",
      },
      {
        numero: 5,
        duree: "3s",
        action: "Texte centré sur fond de ta couleur de marque",
        overlay: "📍 DM 'ONGLES' pour réserver",
      },
    ],
    caption:
      "L'erreur qui casse les ongles naturels — et comment l'éviter 🚨\n\nElle est tellement courante que même mes clientes les plus soigneuses la faisaient sans le savoir.\n\nLimer en va-et-vient chauffe et fragilise la kératine. Résultat : casse garantie.\n\nLa bonne façon : TOUJOURS dans un seul sens, avec douceur.\n\nSauvegarde pour t'en souvenir 💾\n\n📩 Tu veux des ongles en béton ? Envoie-moi 'ONGLES' en DM",
    hashtags: [
      "#onglerie",
      "#astuceongles",
      "#nailcare",
      "#onglesnatural",
      "#reelbeaute",
      "#beautytips",
      "#prothesisteongulaire",
    ],
    musique: "Pop énergique et tendance, tempo 110-120 BPM",
  };
}
