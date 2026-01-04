// Éléments DOM
const raceUrlInput = document.getElementById('raceUrl');
const fetchBtn = document.getElementById('fetchBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const results = document.getElementById('results');
const seedLink = document.getElementById('seedLink');
const hashImages = document.getElementById('hashImages');
const passwordImages = document.getElementById('passwordImages');

// Fonction pour extraire l'ID de la course depuis l'URL
function extractRaceId(url) {
    try {
        // Accepter plusieurs formats
        // https://racetime.gg/ootr/race-id
        // racetime.gg/ootr/race-id
        // /ootr/race-id
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        return urlObj.pathname;
    } catch (e) {
        // Si ce n'est pas une URL valide, supposer que c'est juste le path
        return url.startsWith('/') ? url : `/${url}`;
    }
}

// Fonction pour parser la ligne info_bot
function parseInfoBot(infoBotLine) {
    // Format attendu: "HashBombchu HashBombchu HashBow HashKokiriTunic HashMap | NoteCright NoteA NoteCleft NoteCright NoteCleft NoteCup\nhttps://ootrandomizer.com/seed/get?id=202879"
    // Tout ce qui est avant le | = Hash (enlever le préfixe "Hash")
    // Tout ce qui est après le | jusqu'au lien = Password (garder le préfixe complet comme "Note...")

    const result = {
        seedUrl: null,
        hash: [],
        password: []
    };

    // Extraire l'URL (si présente)
    const urlMatch = infoBotLine.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
        result.seedUrl = urlMatch[1];
        // Enlever l'URL de la ligne pour faciliter le parsing
        infoBotLine = infoBotLine.replace(urlMatch[1], '').trim();
    }

    // Séparer par le pipe |
    const parts = infoBotLine.split('|');

    if (parts.length >= 2) {
        // Partie Hash (avant le |) - enlever le préfixe "Hash" de chaque mot
        const hashPart = parts[0].trim();
        result.hash = hashPart
            .split(/\s+/)
            .filter(item => item && item.startsWith('Hash'))
            .map(item => item.replace(/^Hash/, ''));

        // Partie Password (après le |) - garder les noms complets
        const passwordPart = parts[1].trim();
        result.password = passwordPart
            .split(/\s+/)
            .filter(item => item && item.startsWith('Note'));
    }

    return result;
}

// Fonction pour convertir CamelCase en snake_case
function toSnakeCase(str) {
    // Convertir les majuscules en minuscules précédées d'un underscore
    // SkullToken -> Skull_Token
    // KokiriTunic -> Kokiri_Tunic
    return str.replace(/([a-z])([A-Z])/g, '$1_$2');
}

// Fonction pour créer une image
function createImageElement(name, isHash = false, baseUrl = 'https://racetime.gg/media/') {
    const img = document.createElement('img');
    // Appliquer snake_case uniquement pour les hash
    const fileName = isHash ? toSnakeCase(name) : name;
    img.src = `${baseUrl}${fileName}.png`;
    img.alt = name;
    img.className = 'w-16 h-16 object-contain bg-white rounded-lg shadow-md border-2 border-gray-200 p-1';
    img.onerror = () => {
        img.className = 'w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg shadow-md border-2 border-gray-300 text-xs text-gray-500 p-1';
        img.alt = `❌ ${name}`;
    };
    return img;
}

// Fonction pour afficher les résultats
function displayResults(data) {
    const { seedUrl, hash, password: passwordItems } = data;

    // Afficher le lien de seed
    if (seedUrl) {
        seedLink.href = seedUrl;
        seedLink.textContent = seedUrl;
    } else {
        seedLink.href = '#';
        seedLink.textContent = 'Lien non trouvé';
    }

    // Afficher les images du hash
    hashImages.innerHTML = '';
    if (hash.length > 0) {
        hash.forEach(name => {
            hashImages.appendChild(createImageElement(name, true)); // true = isHash
        });
    } else {
        hashImages.innerHTML = '<p class="text-gray-500">Aucune image hash trouvée</p>';
    }

    // Afficher les images du mot de passe
    passwordImages.innerHTML = '';
    if (passwordItems.length > 0) {
        passwordItems.forEach(name => {
            passwordImages.appendChild(createImageElement(name, false)); // false = pas de snake_case
        });
    } else {
        passwordImages.innerHTML = '<p class="text-gray-500">Aucune image de mot de passe trouvée</p>';
    }

    // Afficher la section résultats
    results.classList.remove('hidden');
}

// Fonction pour afficher une erreur
function showError(message) {
    errorMessage.textContent = message;
    error.classList.remove('hidden');
}

// Fonction pour masquer l'erreur
function hideError() {
    error.classList.add('hidden');
}

// Fonction pour copier dans le presse-papiers
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent || element.href;

    navigator.clipboard.writeText(text).then(() => {
        // Feedback visuel
        const button = event.target.closest('button');
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="flex items-center gap-2">✓ Copié!</span>';
        button.classList.add('bg-green-200', 'text-green-800');

        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('bg-green-200', 'text-green-800');
        }, 2000);
    }).catch(err => {
        console.error('Erreur lors de la copie:', err);
    });
}

// Gestionnaire d'événement pour le bouton
async function fetchRaceData() {
    const url = raceUrlInput.value.trim();

    if (!url) {
        showError('Veuillez entrer une URL racetime.gg');
        return;
    }

    // Masquer les résultats et erreurs précédents
    results.classList.add('hidden');
    hideError();

    // Afficher le chargement
    loading.classList.remove('hidden');

    try {
        const raceId = extractRaceId(url);
        const response = await fetch(`/api/race${raceId}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la récupération des données');
        }

        const data = await response.json();

        // Chercher la ligne info_bot
        const infoBotLine = data.info_bot;

        if (!infoBotLine) {
            throw new Error('Aucune information info_bot trouvée dans les données');
        }

        // Parser les données
        const parsedData = parseInfoBot(infoBotLine);

        // Afficher les résultats
        displayResults(parsedData);

    } catch (err) {
        console.error('Error:', err);
        showError(err.message);
    } finally {
        loading.classList.add('hidden');
    }
}

// Event listeners
fetchBtn.addEventListener('click', fetchRaceData);

raceUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchRaceData();
    }
});

// Rendre la fonction globale pour le onclick
window.copyToClipboard = copyToClipboard;
