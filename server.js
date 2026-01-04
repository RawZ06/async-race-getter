import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({
  logger: true
});

// Static files
await fastify.register(fastifyStatic, {
  root: join(__dirname, 'public'),
  prefix: '/'
});

// Mapping inversé : de HashXXX vers le nom de fichier
const hashMap = {
  'HashBeans': 'Beans',
  'HashBigMagic': 'Big Magic',
  'HashBombchu': 'Bombchu',
  'HashBoomerang': 'Boomerang',
  'HashBossKey': 'Boss Key',
  'HashBottledFish': 'Bottled Fish',
  'HashBottledMilk': 'Bottled Milk',
  'HashBow': 'Bow',
  'HashCompass': 'Compass',
  'HashCucco': 'Cucco',
  'HashDekuNut': 'Deku Nut',
  'HashDekuStick': 'Deku Stick',
  'HashFairyOcarina': 'Fairy Ocarina',
  'HashFrog': 'Frog',
  'HashGoldScale': 'Gold Scale',
  'HashHeart': 'Heart Container',
  'HashHoverBoots': 'Hover Boots',
  'HashKokiriTunic': 'Kokiri Tunic',
  'HashLensOfTruth': 'Lens of Truth',
  'HashLongshot': 'Longshot',
  'HashMap': 'Map',
  'HashMaskOfTruth': 'Mask of Truth',
  'HashMasterSword': 'Master Sword',
  'HashHammer': 'Megaton Hammer',
  'HashMirrorShield': 'Mirror Shield',
  'HashMushroom': 'Mushroom',
  'HashSaw': 'Saw',
  'HashSilvers': 'Silver Gauntlets',
  'HashSkullToken': 'Skull Token',
  'HashSlingshot': 'Slingshot',
  'HashSoldOut': 'SOLD OUT',
  'HashStoneOfAgony': 'Stone of Agony',
};

// Fonction pour convertir le nom du hash en nom de fichier
function hashToFilename(hashWithPrefix) {
  // Chercher dans le mapping (avec le préfixe Hash)
  const filename = hashMap[hashWithPrefix];
  if (filename) {
    // Remplacer les espaces par des underscores dans le nom de fichier
    return filename.replace(/ /g, '_');
  }
  // Si pas trouvé, retourner le nom original sans Hash et avec underscores
  return hashWithPrefix.replace(/^Hash/, '').replace(/ /g, '_');
}

// Fonction pour parser la ligne info_bot
function parseInfoBot(infoBotLine) {
  const result = {
    seedUrl: null,
    hash: [],
    password: []
  };

  // Extraire l'URL
  const urlMatch = infoBotLine.match(/(https?:\/\/[^\s]+)/);
  if (urlMatch) {
    result.seedUrl = urlMatch[1];
    infoBotLine = infoBotLine.replace(urlMatch[1], '').trim();
  }

  // Séparer par le pipe |
  const parts = infoBotLine.split('|');

  if (parts.length >= 2) {
    // Hash (avant le |) - utiliser le mapping pour convertir
    const hashPart = parts[0].trim();
    result.hash = hashPart
      .split(/\s+/)
      .filter(item => item && item.startsWith('Hash'))
      .map(item => {
        // Utiliser le mapping avec le nom complet (avec Hash)
        return hashToFilename(item);
      });

    // Password (après le |) - garder les noms complets
    const passwordPart = parts[1].trim();
    result.password = passwordPart
      .split(/\s+/)
      .filter(item => item && item.startsWith('Note'));
  }

  return result;
}

// Endpoint pour récupérer les données de racetime.gg
fastify.get('/api/race/*', async (request, reply) => {
  // Récupérer tout ce qui vient après /api/race/
  const racePath = request.params['*'];

  try {
    // Construire l'URL racetime.gg
    const url = `https://racetime.gg/${racePath}/data`;

    fastify.log.info(`Fetching data from: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      return reply.status(response.status).send({
        error: `Error fetching data: ${response.statusText}`
      });
    }

    const data = await response.json();

    // Vérifier que info_bot existe
    if (!data.info_bot) {
      return reply.status(400).send({
        error: 'This race was not managed by the bot and data cannot be retrieved'
      });
    }

    // Parser et retourner les données formatées
    const parsedData = parseInfoBot(data.info_bot);
    return parsedData;
  } catch (error) {
    fastify.log.error('Error fetching race data:', error);
    return reply.status(500).send({
      error: 'Error fetching data',
      details: error.message
    });
  }
});

// Démarrer le serveur
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Server running on http://localhost:3000');
    console.log('📝 Open your browser to get started!');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
