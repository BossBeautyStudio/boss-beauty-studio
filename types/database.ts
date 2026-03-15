// ============================================================
// Types — Base de données Supabase
// Correspond exactement aux tables créées dans les migrations SQL
// ============================================================

export type SubscriptionStatus = "active" | "inactive" | "trial" | "cancelled";
export type UserPlan = "starter" | "pro";
export type GenerationType = "planning" | "carousel" | "dm" | "hooks";

// Table: public.users
export interface DbUser {
  id: string;                                    // UUID — correspond à auth.users(id)
  email: string;
  subscription_status: SubscriptionStatus;
  plan: UserPlan;
  quota_monthly: number;                         // nombre de générations max par mois
  quota_used: number;                            // compteur du mois en cours
  quota_reset_at: string;                        // ISO timestamp
  systeme_order_id: string | null;               // ID de commande Systeme.io (legacy)
  stripe_customer_id: string | null;             // ID client Stripe (migration 004)
  stripe_subscription_id: string | null;         // ID abonnement Stripe (migration 004)
  subscription_current_period_end: string | null;// ISO timestamp fin de période (migration 004)
  created_at: string;                            // ISO timestamp
}

// Table: public.pending_activations (migration 004)
export interface DbPendingActivation {
  id: string;                    // UUID
  email: string;                 // lowercase, correspond à auth.users.email
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  created_at: string;            // ISO timestamp
}

// Table: public.user_profiles
export interface DbUserProfile {
  id: string;                       // UUID
  user_id: string;                  // FK → public.users(id)
  business_name: string | null;
  activity: string | null;
  city: string | null;
  positioning: string | null;
  default_tone: string | null;
  instagram_handle: string | null;
  updated_at: string;               // ISO timestamp
}

// Table: public.generations
export interface DbGeneration {
  id: string;                       // UUID
  user_id: string;                  // FK → public.users(id)
  type: GenerationType;
  inputs: Record<string, unknown>;  // JSONB — inputs du formulaire
  output: Record<string, unknown>;  // JSONB — output structuré de Claude
  canva_link: string | null;        // lien Canva éditabe (V1.1+)
  tokens_used: number | null;
  created_at: string;               // ISO timestamp
}

// Réponse quota (endpoint GET /api/user/quota)
export interface QuotaResponse {
  quota_monthly: number;
  quota_used: number;
  quota_remaining: number;
  quota_reset_at: string;
}

// Réponse générique de l'API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Réponse de sauvegarde (endpoint POST /api/save)
export interface SaveResponse {
  success: boolean;
  generation_id?: string;
  error?: string;
}
