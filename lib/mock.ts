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

/** Retourne un PlanningOutput fictif avec exactement 30 posts. */
export function getMockPlanning(): PlanningOutput {
  return {
    posts: [
      {
        jour: 1,
        theme: "Lancement du mois",
        caption:
          "Nouveau mois, nouvelle énergie ✨\n\nC'est le moment de te chouchouter et de prendre soin de toi. Ce mois-ci, je t'accompagne avec des conseils, des routines et des offres spéciales.\n\nDis-moi en commentaire : c'est quoi ton objectif beauté du mois ? 👇",
        hashtags: [
          "#beauté",
          "#soinsbeauté",
          "#routinebeauté",
          "#conseilsbeauté",
          "#beauténaturelle",
        ],
        story: "Sondage : quelle est ta priorité beauté ce mois-ci ?",
        reel: "Présentation rapide des services du mois en 30 secondes avec musique tendance.",
      },
      {
        jour: 2,
        theme: "Conseil éducatif — routine",
        caption:
          "Tu fais peut-être cette erreur chaque matin sans le savoir 😬\n\nAppliquer ta crème sur une peau mal nettoyée, c'est comme peindre sur un mur poussiéreux. Le résultat ne tient pas.\n\n→ Nettoie toujours avant de nourrir. Ta peau absorbera 3× mieux.\n\nSauvegarde ce post 💾 pour t'en souvenir !",
        hashtags: [
          "#conseilpeau",
          "#routinematin",
          "#soinsvisage",
          "#peauparfaite",
          "#beautéquotidienne",
          "#astucesbeauté",
        ],
        story: "Quiz : dans quel ordre tu appliques tes soins le matin ?",
        reel: "Démonstration visuelle : bonne routine vs mauvaise routine en side-by-side.",
      },
      {
        jour: 3,
        theme: "Coulisses — préparation",
        caption:
          "Avant l'ouverture, voilà comment ma journée commence 🌿\n\nPréparation de l'espace, vérification des produits, mise en place de l'ambiance. Chaque détail compte pour que tu te sentes vraiment bien dès que tu franchis la porte.\n\nC'est ce soin du détail qui me tient à cœur 🤍",
        hashtags: [
          "#backstage",
          "#coulissesbeauté",
          "#instit",
          "#ambiancespa",
          "#artisanbeauté",
        ],
        story: "Vidéo rapide : la préparation de la cabine avant le premier rendez-vous.",
        reel: "Timelapse de la mise en place de l'espace de travail le matin.",
      },
      {
        jour: 4,
        theme: "Promotion — réservation",
        caption:
          "📅 Il reste 3 créneaux disponibles cette semaine !\n\nNe laisse pas passer l'occasion de te faire chouchouter. Envoie-moi 'RDV' en DM et je te trouve le créneau parfait.\n\nTon moment de bien-être t'attend 💆‍♀️",
        hashtags: [
          "#rendezvoussoin",
          "#disponibilités",
          "#prendrerdv",
          "#soinsquébec",
          "#beauténear",
          "#bookNow",
        ],
        story: "Compte à rebours : créneaux disponibles cette semaine.",
        reel: "Ambiance d'une séance : avant/pendant/après en 20 secondes.",
      },
      {
        jour: 5,
        theme: "Témoignage client",
        caption:
          "Ça fait chaud au cœur de lire ça 🥹\n\n\"Je suis repartie complètement différente. Pas juste physiquement — aussi mentalement. Merci pour ce moment rien qu'à moi.\"\n\nC'est exactement pour ça que je fais ce métier. Merci à toi de me faire confiance 🤍",
        hashtags: [
          "#aviscliente",
          "#témoignage",
          "#satisfactionclient",
          "#institsatisfaite",
          "#beauténaturelle",
        ],
        story: "Question : c'était quoi ton dernier moment rien qu'à toi ?",
        reel: "Montage de photos avant/après avec témoignage en voix off.",
      },
      {
        jour: 6,
        theme: "Éducatif — ingrédient star",
        caption:
          "L'acide hyaluronique : tout le monde en parle, mais c'est quoi vraiment ? 🔬\n\n→ C'est une molécule naturellement présente dans la peau.\n→ Elle retient jusqu'à 1000× son poids en eau.\n→ Elle repulpe, hydrate et lisse les petites ridules.\n\nTu l'utilises déjà dans ta routine ? Dis-moi en commentaire 👇",
        hashtags: [
          "#acidehyaluronique",
          "#hydrataionpeau",
          "#ingrédientactif",
          "#soinsexpert",
          "#peauhydratée",
          "#dermocosmétique",
        ],
        story: "Sondage : tu utilises de l'acide hyaluronique ? Oui / Non",
        reel: "Explication de l'acide hyaluronique avec animation simple et produit en main.",
      },
      {
        jour: 7,
        theme: "Inspiration beauté — citation",
        caption:
          "\"Prendre soin de soi, c'est un acte de respect envers qui tu es.\"\n\nTrop souvent, on remet ça à plus tard. On s'occupe de tout le monde sauf de soi.\n\nCette semaine, donne-toi la permission de te poser. Tu le mérites. 🌸",
        hashtags: [
          "#selfcare",
          "#bienêtre",
          "#citationbeauté",
          "#prensoindetoi",
          "#mindset",
        ],
        story: "Citation du jour en format esthétique à partager.",
        reel: "Montage ambiance relaxation avec musique douce et texte inspirant.",
      },
      {
        jour: 8,
        theme: "Avant/Après",
        caption:
          "Le résultat parle de lui-même 😍\n\nÀ gauche : arrivée. À droite : départ.\n\nMême personne. Quelques heures de soin. Un sourire en plus.\n\nTu veux toi aussi ce résultat ? Envoie-moi 'INFO' en DM 📩",
        hashtags: [
          "#avantaprès",
          "#transformation",
          "#résultatsoin",
          "#avantaprèsbeauté",
          "#prouvéefficace",
          "#soins",
        ],
        story: "Reveal progressif du résultat en mode glissière.",
        reel: "Transition before/after avec effet split-screen.",
      },
      {
        jour: 9,
        theme: "Éducatif — erreurs courantes",
        caption:
          "5 erreurs que tu fais probablement avec ta peau (et comment les corriger) 👇\n\n1. Te démaquiller avec des lingettes (ça irrite)\n2. Sauter la crème si tu as la peau grasse (erreur !)\n3. Appliquer les actifs dans le mauvais ordre\n4. Oublier le SPF en hiver\n5. Changer de produits trop souvent\n\nSauvegarde 💾 — tu m'en diras des nouvelles !",
        hashtags: [
          "#erreursbeauté",
          "#conseilpeau",
          "#skincaretips",
          "#routinepeau",
          "#soinsvisage",
          "#astucepeau",
        ],
        story: "Quiz : tu fais combien de ces 5 erreurs ?",
        reel: "Format éducatif : une erreur par coupe, rapide et punchy.",
      },
      {
        jour: 10,
        theme: "Coulisses — produits utilisés",
        caption:
          "Petite transparence sur ce que j'utilise en cabine 🧴\n\nJe sélectionne chaque produit avec soin : efficacité prouvée, composition clean, résultats visibles.\n\nTu veux savoir quel soin je recommande pour ton type de peau ? Envoie-moi ton profil en DM 💌",
        hashtags: [
          "#produitsbeauté",
          "#soinspro",
          "#cosmétiqueclean",
          "#beauténaturelle",
          "#instit",
          "#transparence",
        ],
        story: "Unboxing rapide d'un nouveau produit reçu.",
        reel: "Présentation des produits phares avec focus macro sur les textures.",
      },
      {
        jour: 11,
        theme: "Éducatif — type de peau",
        caption:
          "Tu ne sais pas vraiment quel est ton type de peau ? Voilà comment le reconnaître 🔍\n\n→ Peau sèche : tiraillements, éclat terne, pores fins\n→ Peau grasse : brillances, pores dilatés, boutons fréquents\n→ Peau mixte : zone T grasse, joues normales ou sèches\n→ Peau sensible : rougeurs, réactions, inconfort\n\nQuel est le tien ? Réponds en commentaire 👇",
        hashtags: [
          "#typedepeau",
          "#peaugrasse",
          "#peausèche",
          "#peausensible",
          "#peaumixte",
          "#conseilpeau",
        ],
        story: "Sondage à 4 options : quel est ton type de peau ?",
        reel: "Vidéo explicative avec démonstration visuelle de chaque type de peau.",
      },
      {
        jour: 12,
        theme: "Promotion — offre spéciale",
        caption:
          "🎁 Offre du mois : -15% sur le soin signature pour toute nouvelle cliente !\n\nC'est l'occasion idéale de découvrir ce que mes clientes adorent.\n\nValable jusqu'au [date]. Places limitées — envoie-moi 'OFFRE' en DM pour réserver 📩",
        hashtags: [
          "#offrebeauté",
          "#promobeauté",
          "#nouveauxclients",
          "#soinsignature",
          "#réservermaintenant",
          "#instit",
        ],
        story: "Compte à rebours : combien de jours reste-t-il pour profiter de l'offre ?",
        reel: "Présentation du soin signature : ce qui est inclus, le résultat attendu.",
      },
      {
        jour: 13,
        theme: "Divertissement — quiz beauté",
        caption:
          "Petit quiz beauté 🤓 Combien tu as de bonnes réponses ?\n\n1. L'SPF 50 protège combien de fois plus que l'SPF 30 ? (réponse : 2×)\n2. La Vitamine C est plus efficace le matin ou le soir ? (matin)\n3. L'eau micellaire suffit-elle à démaquiller ? (non !)\n\nTon score ? Dis-moi en commentaire 👇",
        hashtags: [
          "#quizbeauté",
          "#beautyquiz",
          "#conseilspeau",
          "#testbeauté",
          "#skincarefan",
          "#beauténerd",
        ],
        story: "Quiz interactif story avec réponse révélée après 24h.",
        reel: "Format quiz rapide : question + réponse en pop + explication courte.",
      },
      {
        jour: 14,
        theme: "Témoignage — fidélité client",
        caption:
          "Certaines clientes viennent me voir depuis des années. Ça, c'est ma plus belle récompense 💛\n\n\"Je ne vais nulle part ailleurs. Chaque séance est un moment de paix.\"\n\nMerci pour ta confiance. C'est pour toi que je me perfectionne chaque jour 🙏",
        hashtags: [
          "#fidélitéclient",
          "#relationclient",
          "#confiance",
          "#instit",
          "#beauténaturelle",
          "#bienêtre",
        ],
        story: "Partage d'un message de fidèle cliente (anonymisé).",
        reel: "Montage émotion : moments capturés avec clientes fidèles.",
      },
      {
        jour: 15,
        theme: "Mi-mois — bilan + offre",
        caption:
          "On est déjà au milieu du mois ! ⏳\n\nTu t'es accordé un moment rien que pour toi ce mois-ci ?\n\nIl reste des créneaux cette semaine. Envoie-moi 'RDV' en DM et on s'organise 📩\n\nParce que tu mérites mieux que de t'oublier.",
        hashtags: [
          "#selfcarematters",
          "#soinsbeauté",
          "#rendezvoussoin",
          "#bienêtrequotidien",
          "#instit",
        ],
        story: "Rappel créneaux disponibles + invitation à booker.",
        reel: "Résumé visuel de la quinzaine : résultats clientes, ambiance, soins.",
      },
      {
        jour: 16,
        theme: "Éducatif — SPF et soleil",
        caption:
          "La vérité sur la crème solaire que personne ne te dit ☀️\n\nL'SPF ne bloque pas à 100%. Il filtre. Ça veut dire que le réappliquer toutes les 2h, c'est non négociable.\n\nEn hiver aussi. Les UVA traversent les nuages et les vitres. Chaque jour. 365 jours par an.\n\nTu l'appliques déjà quotidiennement ? 👇",
        hashtags: [
          "#crèmesolaire",
          "#spf50",
          "#uvprotection",
          "#soinssoleil",
          "#conseilpeau",
          "#antiaging",
        ],
        story: "Sondage : tu mets de la crème solaire en hiver ?",
        reel: "Explication des UVA vs UVB avec démonstration simple de protection.",
      },
      {
        jour: 17,
        theme: "Coulisses — formation / veille",
        caption:
          "Je me forme régulièrement pour rester à la pointe des techniques 📚\n\nParce que la beauté évolue vite. Et parce que tu mérites les meilleurs soins disponibles.\n\nCette semaine j'ai appris [technique]. Je suis impatiente de te l'appliquer 🤩",
        hashtags: [
          "#formation",
          "#professionnellebeauté",
          "#apprentissage",
          "#instit",
          "#continuouslearning",
          "#expertisebeauté",
        ],
        story: "Story de partage : ce que j'ai appris cette semaine.",
        reel: "Moment de formation filmé ou produit/technique découvert.",
      },
      {
        jour: 18,
        theme: "Éducatif — démaquillage",
        caption:
          "Le démaquillage est l'étape la plus sous-estimée de ta routine 😮\n\nMal démaquillée → pores bouchés → imperfections → vieillissement accéléré.\n\nLa méthode que je recommande à toutes mes clientes :\n→ Huile démaquillante d'abord (dissout le maquillage gras)\n→ Gel nettoyant ensuite (élimine les résidus)\n→ Eau micellaire EN DERNIER pour finir proprement\n\nSauvegarde 💾 pour ce soir !",
        hashtags: [
          "#démaquillage",
          "#doublenettoyage",
          "#routinesoir",
          "#conseilpeau",
          "#peauparfaite",
          "#soinsoir",
        ],
        story: "Démonstration en direct : ma routine de démaquillage du soir.",
        reel: "Double nettoyage step-by-step en 45 secondes.",
      },
      {
        jour: 19,
        theme: "Inspiration — beauté inclusive",
        caption:
          "La beauté n'a pas de standard 🌍\n\nToutes les peaux sont belles. Tous les âges sont beaux. Mon rôle n'est pas de transformer — c'est de révéler et de sublimer ce que tu as déjà.\n\nTu mérites de te sentir bien dans ta peau, chaque jour. C'est tout. 🤍",
        hashtags: [
          "#beautéinclusive",
          "#allbeauty",
          "#beauténaturelle",
          "#confianceensoi",
          "#bienêtre",
          "#selfesteem",
        ],
        story: "Question ouverte : qu'est-ce qui te fait te sentir belle ?",
        reel: "Montage diversité : différentes clientes, différents styles, même éclat.",
      },
      {
        jour: 20,
        theme: "Éducatif — stress et peau",
        caption:
          "Tu stresses beaucoup en ce moment ? Ta peau te le dit 😬\n\nLe cortisol (hormone du stress) provoque :\n→ Poussées d'acné\n→ Teint terne\n→ Déshydratation\n→ Sensibilité accrue\n\nLa solution : traiter le dedans autant que le dehors. Un soin en cabine, c'est aussi une pause mentale.\n\nEnvoie-moi 'PAUSE' en DM si tu as besoin de souffler 🌿",
        hashtags: [
          "#stressetpeau",
          "#cortisol",
          "#peauacnéique",
          "#bienêtrepeau",
          "#holistic",
          "#beauténaturelle",
          "#soinsvisage",
        ],
        story: "Partage : 3 astuces rapides pour calmer la peau en période de stress.",
        reel: "Explication lien stress-peau avec visuel clair et solution en fin de vidéo.",
      },
      {
        jour: 21,
        theme: "Promotion — pack cadeau",
        caption:
          "💝 Tu cherches une idée cadeau qui fait vraiment plaisir ?\n\nOublie les bons d'achat impersonnels. Offre un vrai moment de bien-être.\n\nMes cartes cadeaux sont disponibles à partir de [montant]. Contacte-moi en DM pour commander 📩\n\nParfait pour un anniversaire, une fête des mères, ou juste pour dire 'je pense à toi' 🌸",
        hashtags: [
          "#cartecadeau",
          "#cadeaubeauté",
          "#ideecadeau",
          "#fetedesmeres",
          "#cadeaufemme",
          "#instit",
        ],
        story: "Présentation visuelle des cartes cadeaux disponibles.",
        reel: "Unboxing d'une carte cadeau : le packaging, le moment d'ouverture.",
      },
      {
        jour: 22,
        theme: "Coulisses — la vraie journée",
        caption:
          "Une vraie journée de travail ressemble à ça 📋\n\n7h30 : préparation de l'espace\n9h : première cliente\n12h : pause courte (très courte 😅)\n13h : reprise\n18h : dernière cliente, rangement\n19h : veille produits, planification du lendemain\n\nC'est intense. Et je ne changerai pour rien au monde 🤍",
        hashtags: [
          "#journéeinstit",
          "#coulissesbeauté",
          "#métierdébeauté",
          "#instit",
          "#entrepreneurefemme",
          "#passionbeauté",
        ],
        story: "Format 'day in my life' : stories de la journée en temps réel.",
        reel: "Vlog rapide d'une journée type : prep → clientes → fermeture.",
      },
      {
        jour: 23,
        theme: "Éducatif — eye contour",
        caption:
          "La zone contour des yeux vieillit 2× plus vite que le reste du visage 👁️\n\nPourquoi ? La peau y est 10× plus fine. Elle supporte mal le frottement, les UV et la déshydratation.\n\nCe que tu dois faire dès maintenant :\n→ Appliquer la crème yeux matin ET soir\n→ En tapotant doucement (jamais frotter)\n→ Avec l'annulaire (moins de pression)\n\nTu utilisais déjà la bonne technique ? 👇",
        hashtags: [
          "#contourdesyeux",
          "#soinsyeux",
          "#antirides",
          "#antiaging",
          "#soinsvisage",
          "#astucesbeauté",
        ],
        story: "Démonstration : application crème yeux, bonne technique vs mauvaise.",
        reel: "Zoom sur la technique d'application contour des yeux étape par étape.",
      },
      {
        jour: 24,
        theme: "Divertissement — tendances",
        caption:
          "Les tendances beauté qui cartonnent en ce moment 🔥\n\n1. La peau 'glass skin' : hydratation maximale, éclat naturel\n2. Le no-makeup makeup : corriger sans cacher\n3. Les soins multi-steps simplifiés : moins de produits, plus d'efficacité\n4. Le retour de la routine gua sha et massage facial\n\nLaquelle tu adoptes ? Ou tu résistes à toutes ? 😄",
        hashtags: [
          "#tendancesbeauté",
          "#glasskin",
          "#nomakeup",
          "#guasha",
          "#beautétrend",
          "#skincaretrend",
        ],
        story: "Vote : quelle tendance tu testes en premier ?",
        reel: "Présentation de chaque tendance avec démo rapide et opinion perso.",
      },
      {
        jour: 25,
        theme: "Témoignage — résultat visible",
        caption:
          "3 semaines de protocole. Regarde ce résultat 🤩\n\nMon suivi personnalisé fait vraiment la différence. Ce n'est pas de la chance — c'est un protocole adapté à la peau de [cliente], suivi à la lettre.\n\nToi aussi tu veux un suivi sur-mesure ? Envoie-moi ton profil en DM 📩",
        hashtags: [
          "#résultatsréels",
          "#avantaprès",
          "#protocolepersonnalisé",
          "#soinsurmsure",
          "#transformation",
          "#instit",
        ],
        story: "Slider avant/après interactif en story.",
        reel: "Témoignage client filmé ou progression en photos sur fond de musique.",
      },
      {
        jour: 26,
        theme: "Éducatif — l'eau et la peau",
        caption:
          "Tu bois assez d'eau ? Ta peau te donne la réponse 💧\n\nSi tu as :\n→ Des petites ridules qui apparaissent\n→ Un teint terne et fatigué\n→ Une peau qui tire après le nettoyage\n\n... tu es probablement déshydratée de l'intérieur.\n\n1,5L d'eau par jour minimum. Ton soin le moins cher et le plus efficace.\n\nCombien tu bois par jour en vrai ? 👇",
        hashtags: [
          "#eaupeau",
          "#hydratation",
          "#boisdeL'eau",
          "#beautéintérieure",
          "#peau",
          "#routinebeauté",
        ],
        story: "Challenge hydratation : boire 2L aujourd'hui et partager.",
        reel: "Avant/après hydratation (matin après mauvaise nuit vs peau bien hydratée).",
      },
      {
        jour: 27,
        theme: "Coulisses — organisation / agenda",
        caption:
          "Voilà comment je m'organise pour avoir du temps pour mes clientes ET pour moi 📅\n\nJ'ai appris qu'un agenda bien géré, c'est moins de stress pour tout le monde. Moi. Et toi.\n\nTu veux réserver ? Mon planning de [mois suivant] est en ligne. Envoie 'AGENDA' en DM 📩",
        hashtags: [
          "#agendabeauté",
          "#organisation",
          "#réservation",
          "#instit",
          "#entrepreneurefemme",
          "#booking",
        ],
        story: "Capture d'agenda (floutée) : les créneaux encore disponibles.",
        reel: "Organisation de la semaine type d'une instit en 60 secondes.",
      },
      {
        jour: 28,
        theme: "Promotion — dernier rappel",
        caption:
          "Dernière semaine du mois ⏳\n\nTu avais prévu de te faire chouchouter ? Il est encore temps.\n\nDes créneaux sont disponibles jeudi et vendredi. Envoie-moi 'RDV' en DM — je te réponds dans la minute 📩\n\nN'oublie pas de prendre soin de toi avant de t'occuper des autres 🌸",
        hashtags: [
          "#findemois",
          "#créneaux",
          "#rendezvoussoin",
          "#instit",
          "#selfcare",
          "#soinsbeauté",
        ],
        story: "Compte à rebours : derniers créneaux du mois.",
        reel: "Récap mensuel : résultats, nouveautés, moments forts.",
      },
      {
        jour: 29,
        theme: "Éducatif — nuit et peau",
        caption:
          "La nuit, ta peau fait un travail de dingue pendant que tu dors 🌙\n\nEntre 22h et 2h : pic de production de mélatonine et réparation cellulaire maximum.\n\nC'est pour ça que ta crème de nuit est plus concentrée que celle du matin — et que mal dormir se voit sur le visage.\n\n8h de sommeil + bonne crème de nuit = le soin le plus puissant qui existe.\n\nTu dors bien en ce moment ? 💤",
        hashtags: [
          "#sommeilpeau",
          "#crèmedenuit",
          "#régénérationpeau",
          "#antiaging",
          "#beautysleep",
          "#routinesoir",
        ],
        story: "Partage ta routine du soir avec moi !",
        reel: "Explication du cycle de réparation nocturne de la peau en animation.",
      },
      {
        jour: 30,
        theme: "Bilan du mois — rendez-vous prochain",
        caption:
          "30 jours ensemble 🥹 Merci d'être là !\n\nCe mois-ci on a parlé de [thèmes abordés]. J'espère que tu repars avec des conseils qui font vraiment la différence.\n\nMois prochain, on ira encore plus loin. Et si tu n'es pas encore passée me voir... c'est le moment 😉\n\nEnvoie-moi 'MOISPROCHAIN' en DM pour les créneaux disponibles 📩\n\nPrends soin de toi. Toujours. 🌸",
        hashtags: [
          "#bilandumois",
          "#merci",
          "#rendezvoussoin",
          "#instit",
          "#beauténaturelle",
          "#selfcare",
        ],
        story: "Story de clôture du mois : bilan, remerciements, teaser du prochain.",
        reel: "Montage best-of du mois : résultats, moments forts, clientes heureuses.",
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
