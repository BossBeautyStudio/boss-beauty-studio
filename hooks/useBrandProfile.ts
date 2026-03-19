// ============================================================
// hooks/useBrandProfile.ts
//
// Hook partagé pour charger le profil de marque de l'utilisatrice.
// Utilisé dans chaque module pour pré-remplir les champs de formulaire.
// ============================================================

import { useState, useEffect } from "react";

export interface BrandProfile {
  id?: string;
  user_id?: string;
  nom_marque?: string | null;
  specialite?: string | null;
  ton_style?: string | null;
  public_cible?: string | null;
  hashtags_favoris?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function useBrandProfile() {
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/brand-profile")
      .then((r) => r.json())
      .then((data: BrandProfile | null) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return { profile, loading };
}
