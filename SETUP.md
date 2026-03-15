# Boss Beauty Studio — Setup & Test de la Phase 0

## Prérequis

- Node.js 18+ installé sur ta machine
- Un compte Supabase (gratuit suffit pour démarrer)
- Un compte Anthropic avec une API key

---

## Étape 1 — Installer les dépendances

Depuis le dossier du projet :

```bash
cd boss-beauty-studio
npm install
```

---

## Étape 2 — Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Ouvre `.env.local` et remplis :

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
WEBHOOK_SECRET=<génère avec: openssl rand -base64 32>
CRON_SECRET=<génère avec: openssl rand -base64 32>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Où trouver les clés Supabase :**
Supabase Dashboard → ton projet → Settings → API

---

## Étape 3 — Exécuter les migrations SQL dans Supabase

Dans Supabase Dashboard → SQL Editor, exécute les migrations dans l'ordre :

**1. Copie et exécute `supabase/migrations/001_users.sql`**
Vérifie que la table `public.users` et le trigger `on_auth_user_created` ont été créés.

**2. Copie et exécute `supabase/migrations/002_user_profiles.sql`**
Vérifie que la table `public.user_profiles` a été créée.

**3. Copie et exécute `supabase/migrations/003_generations.sql`**
Vérifie que la table `public.generations` et la vue `user_generation_stats` ont été créées.

**Vérification rapide dans le SQL Editor :**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Doit retourner: generations, user_profiles, users, user_generation_stats
```

---

## Étape 4 — Configurer Supabase Auth

Dans Supabase Dashboard → Authentication → Providers :

1. Activer **Email** (activé par défaut)
2. Dans Email → s'assurer que "Enable email confirmations" est désactivé en dev (ou activer les magic links)
3. Dans Authentication → URL Configuration :
   - Site URL : `http://localhost:3000`
   - Redirect URLs : `http://localhost:3000/**`

---

## Étape 5 — Lancer le serveur de développement

```bash
npm run dev
```

Le projet tourne sur `http://localhost:3000`

---

## ✅ Tests de validation de cette phase

### Test 1 — Le projet compile sans erreur

```bash
npm run build
# Doit terminer sans erreur TypeScript
```

### Test 2 — Les tables Supabase existent avec le bon schéma

Dans SQL Editor Supabase :
```sql
-- Vérifier la structure de users
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier que le RLS est activé
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- rowsecurity doit être TRUE pour les 3 tables
```

### Test 3 — Le trigger de création automatique fonctionne

Dans Supabase Dashboard → Authentication → Users → "Invite user" avec une vraie adresse email.
Ensuite dans SQL Editor :
```sql
SELECT id, email, subscription_status, quota_monthly, quota_used
FROM public.users;
-- L'utilisateur doit apparaître avec subscription_status = 'inactive'
```

### Test 4 — Les variables d'environnement sont chargées

Crée un fichier de test temporaire `test-env.js` à la racine :
```js
// test-env.js — À SUPPRIMER après le test
require('dotenv').config({ path: '.env.local' })
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ OK' : '❌ MANQUANT')
console.log('ANTHROPIC_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ OK' : '❌ MANQUANT')
console.log('SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ OK' : '❌ MANQUANT')
```
```bash
node test-env.js
# Supprimer test-env.js ensuite
```

---

## ⚠️ Problèmes courants

**Erreur "relation public.users does not exist"**
→ Les migrations n'ont pas été exécutées. Recommence depuis l'Étape 3.

**Erreur "Missing SUPABASE_URL"**
→ Le fichier `.env.local` n'existe pas ou les variables sont mal nommées.
→ Vérifier qu'il n'y a pas d'espaces autour du `=`.

**Trigger ne crée pas l'utilisateur automatiquement**
→ Vérifier que le trigger `on_auth_user_created` existe :
```sql
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users';
```

---

## 📋 Récapitulatif de cette phase

| Fichier | Statut |
|---------|--------|
| `package.json` | ✅ Créé |
| `tsconfig.json` | ✅ Créé |
| `next.config.ts` | ✅ Créé |
| `tailwind.config.ts` | ✅ Créé |
| `postcss.config.mjs` | ✅ Créé |
| `vercel.json` | ✅ Créé |
| `.gitignore` | ✅ Créé |
| `.env.local.example` | ✅ Créé |
| `middleware.ts` | ✅ Créé |
| `types/planning.ts` | ✅ Créé |
| `types/carousel.ts` | ✅ Créé |
| `types/dm.ts` | ✅ Créé |
| `types/database.ts` | ✅ Créé |
| `lib/supabase/server.ts` | ✅ Créé |
| `lib/supabase/client.ts` | ✅ Créé |
| `supabase/migrations/001_users.sql` | ✅ Créé |
| `supabase/migrations/002_user_profiles.sql` | ✅ Créé |
| `supabase/migrations/003_generations.sql` | ✅ Créé |

## Prochaine phase

Une fois les 4 tests validés, on passe à **Phase 3 — lib/claude.ts + lib/prompts.ts + lib/quota.ts + lib/db.ts**.
C'est le cœur du produit — les wrappers Claude et la logique de quota.
