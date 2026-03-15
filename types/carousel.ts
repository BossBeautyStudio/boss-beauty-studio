// ============================================================
// Types — Module Carrousel Instagram
// ============================================================

export interface CarouselInput {
  sujet: string;          // ex: "5 erreurs qui abîment les cils"
  activite: string;       // ex: "Technicienne cils"
  objectif: string;       // ex: "Éduquer et attirer de nouveaux clients"
  ton: string;            // ex: "Expert & accessible"
  promo?: string | null;  // optionnel
}

export type SlideRole = "cover" | "intro" | "contenu" | "preuve" | "cta";

export interface CarouselSlide {
  slide_number: number;         // 1 à N
  role: SlideRole;
  headline: string;             // titre principal (court, percutant)
  body: string;                 // texte secondaire (1 à 3 phrases)
  visual_suggestion: string;    // suggestion de photo/visuel
  // canva_field_id est dérivé automatiquement : `slide_${slide_number}_headline`
}

export interface CarouselMetadata {
  sujet: string;
  activite: string;
  objectif: string;
  ton: string;
}

export interface CarouselOutput {
  metadata: CarouselMetadata;
  carousel: {
    title: string;              // titre global du carrousel
    slides_count: number;       // entre 5 et 10
    slides: CarouselSlide[];
    caption: string;            // caption Instagram complète
    hashtags: string[];         // 12 à 15 hashtags
    cta: string;                // call-to-action final
  };
}

// Helper : dériver le canva_field_id depuis le numéro de slide
export function getCanvaFieldId(slideNumber: number, field: "headline" | "body"): string {
  return `slide_${slideNumber}_${field}`;
}

// Type pour la sauvegarde en DB
export interface CarouselGenerationRecord {
  type: "carousel";
  inputs: CarouselInput;
  output: CarouselOutput;
}
