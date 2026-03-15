// ============================================================
// Types — Module Réponses DM / WhatsApp
// ============================================================

export type ObjectifReponse =
  | "informer"
  | "closer"
  | "rassurer"
  | "relancer";

export type Urgence = "faible" | "moyenne" | "haute";

export interface DMInput {
  message: string;              // message client reçu (texte libre)
  activite: string;             // ex: "Technicienne cils"
  positionnement: string;       // ex: "Premium" | "Accessible" | "Expert"
  objectif_reponse: ObjectifReponse;
}

export interface DMVariant {
  text: string;                 // texte de la réponse
  tone_note: string;            // note courte sur le ton utilisé
}

export interface DMVariantPremium extends DMVariant {
  closing_technique: string;    // technique de closing utilisée
}

export interface DMAnalyse {
  intention_client: string;     // ce que veut vraiment la cliente
  objection_detectee: string | null;
  urgence: Urgence;
}

export interface DMOutput {
  analyse: DMAnalyse;
  responses: {
    short: DMVariant;           // 2-3 lignes max
    standard: DMVariant;        // 4-6 lignes
    premium: DMVariantPremium;  // 6-10 lignes, technique de closing
  };
  follow_up: string | null;     // relance si pas de réponse dans 48h
}

// Type pour la sauvegarde en DB
export interface DMGenerationRecord {
  type: "dm";
  inputs: DMInput;
  output: DMOutput;
}
