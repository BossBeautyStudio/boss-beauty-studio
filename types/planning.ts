// ============================================================
// Types — Module Planning 30 Jours
// Format "Standard compact" : 5 champs par jour
// Optimisé pour réduire les tokens Claude (~3500-4500 tokens)
// ============================================================

export interface PlanningInput {
  activite: string;       // ex: "Technicienne cils"
  ville: string;          // ex: "Casablanca"
  objectif: string;       // ex: "Remplir l'agenda de juin"
  ton: string;            // ex: "Glamour & expert"
  promo?: string | null;  // ex: "Extension cils -20% jusqu'au 15 juin" (optionnel)
}

export interface PlanningDay {
  d: number;              // 1 à 30
  theme: string;          // ex: "Expertise & Confiance"
  caption: string;        // caption complète prête à poster (avec emojis)
  tags: string[];         // 8 à 12 hashtags
  story: string;          // idée de story en 1 phrase
  reel: string;           // hook du reel/tiktok en 1 phrase accrocheuse
}

export interface PlanningMetadata {
  activite: string;
  ville: string;
  objectif: string;
  ton: string;
  promo: string | null;
}

export interface PlanningOutput {
  metadata: PlanningMetadata;
  days: PlanningDay[];    // exactement 30 éléments
}

// Type pour la sauvegarde en DB
export interface PlanningGenerationRecord {
  type: "planning";
  inputs: PlanningInput;
  output: PlanningOutput;
}
