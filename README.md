# 🏁 Async Race Seed Getter

Une application web pour récupérer facilement les informations de seed et mot de passe depuis racetime.gg.

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Lancement

```bash
npm start
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📖 Utilisation

1. Copiez le lien de votre course depuis racetime.gg
   - Exemple: `https://racetime.gg/ootr/your-race-id`

2. Collez le lien dans le champ de texte

3. Cliquez sur "Récupérer"

4. Les informations seront affichées :
   - **Seed** : Lien vers la seed avec les images du hash
   - **Mot de passe** : Images du mot de passe avec le texte

5. Utilisez les boutons "Copier" pour copier rapidement le lien ou le mot de passe

## 🛠️ Fonctionnalités

- ✅ Récupération automatique des données via proxy backend (évite les problèmes CORS)
- ✅ Interface moderne avec Tailwind CSS
- ✅ Affichage des images du hash (sans préfixe "Hash")
- ✅ Affichage des images du mot de passe (avec préfixe complet)
- ✅ Boutons de copie rapide
- ✅ Gestion des erreurs
- ✅ Design responsive

## 📁 Structure du projet

```
async-race-getter/
├── server.js          # Serveur Express avec proxy
├── package.json       # Dépendances npm
├── public/
│   ├── index.html    # Interface utilisateur
│   └── app.js        # Logique frontend
└── README.md         # Ce fichier
```

## 🔧 Technologies utilisées

- **Backend** : Node.js, Express, node-fetch
- **Frontend** : HTML, JavaScript, Tailwind CSS
- **Proxy** : Pour éviter les problèmes CORS avec racetime.gg

## 📝 Notes

- Le format attendu pour `info_bot` est : `"Hash: [images] | Password: [images]"`
- Les images du hash n'incluent PAS le préfixe "Hash" (ex: `Frog.png`)
- Les images du mot de passe incluent le préfixe complet (ex: `NoteCright.png`)
- Les images sont chargées depuis `https://racetime.gg/media/`
