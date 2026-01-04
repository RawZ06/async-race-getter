# 🏁 Async Race Seed Getter

Une application web moderne pour récupérer facilement les informations de seed et mot de passe depuis racetime.gg.

## 🚀 Démarrage rapide

### Installation

```bash
pnpm install
```

### Lancement

```bash
pnpm start
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Mode développement

```bash
pnpm dev
```

Le serveur redémarrera automatiquement à chaque modification.

## 📖 Utilisation

1. Copiez le lien de votre course depuis racetime.gg
   - Exemple: `https://racetime.gg/ootr/your-race-id`

2. Collez le lien dans le champ de texte

3. Cliquez sur "Récupérer" ou appuyez sur Entrée

4. Les informations seront affichées :
   - **Seed** : Lien vers la seed avec bouton de copie
   - **Hash** : Images du hash (sans préfixe "Hash")
   - **Mot de passe** : Images du mot de passe

5. Cliquez sur "Copier" pour copier rapidement le lien de la seed

## 🛠️ Fonctionnalités

- ✅ Backend moderne avec Fastify et ES6 modules
- ✅ Frontend réactif avec Alpine.js
- ✅ Interface élégante avec Tailwind CSS
- ✅ Proxy backend pour éviter les problèmes CORS
- ✅ Conversion automatique des noms (snake_case pour les hash)
- ✅ Bouton de copie rapide pour la seed
- ✅ Gestion des erreurs
- ✅ Design responsive
- ✅ Hot reload en mode développement

## 📁 Structure du projet

```
async-race-getter/
├── server.js          # Serveur Fastify avec ES6 modules
├── package.json       # Dépendances et configuration
├── public/
│   └── index.html    # Interface Alpine.js + Tailwind
└── README.md         # Ce fichier
```

## 🔧 Stack technique

- **Backend** :
  - Fastify (serveur web rapide)
  - ES6 Modules (import/export natif)
  - Native fetch API (Node.js moderne)

- **Frontend** :
  - Alpine.js (framework réactif léger)
  - Tailwind CSS (styling)
  - Vanilla JavaScript

## 📝 Notes techniques

- Le format attendu pour `info_bot` est : `"HashXXX HashYYY | NoteAAA NoteBBB\nhttps://..."`
- Les images du hash n'incluent PAS le préfixe "Hash" et sont converties en snake_case (ex: `SkullToken` → `Skull_Token.png`)
- Les images du mot de passe gardent leur préfixe complet (ex: `NoteCright.png`)
- Les images sont chargées depuis `https://racetime.gg/media/`
- Utilise `pnpm` pour la gestion des dépendances (plus rapide que npm)
