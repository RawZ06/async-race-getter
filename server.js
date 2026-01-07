import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname,reqId,responseTime,req,res',
        singleLine: true,
        colorize: true
      }
    }
  }
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

// Endpoint pour récupérer les données de seed de racetime.gg
fastify.get('/api/race/:category/:raceSlug/seed', async (request, reply) => {
  const { category, raceSlug } = request.params;
  const racePath = `${category}/${raceSlug}`;

  try {
    const url = `https://racetime.gg/${racePath}/data`;
    const response = await fetch(url);

    if (!response.ok) {
      fastify.log.warn(`Seed fetch failed for ${racePath}: ${response.statusText}`);
      return reply.status(response.status).send({
        error: `Error fetching data: ${response.statusText}`
      });
    }

    const data = await response.json();

    if (!data.info_bot) {
      fastify.log.warn(`No info_bot data for ${racePath} (not managed by Mido's bot)`);
      return reply.status(400).send({
        error: 'This race was not managed by Mido\'s bot and data cannot be retrieved'
      });
    }

    const parsedData = parseInfoBot(data.info_bot);
    fastify.log.info(`✓ Seed data retrieved for ${racePath}`);
    return parsedData;
  } catch (error) {
    fastify.log.error(`✗ Error fetching seed for ${racePath}:`, error.message);
    return reply.status(500).send({
      error: 'Error fetching data',
      details: error.message
    });
  }
});

// Endpoint pour récupérer les entrants et leurs temps
fastify.get('/api/race/:category/:raceSlug/entrants', async (request, reply) => {
  const { category, raceSlug } = request.params;
  const racePath = `${category}/${raceSlug}`;

  try {
    const url = `https://racetime.gg/${racePath}/data`;
    const response = await fetch(url);

    if (!response.ok) {
      fastify.log.warn(`Entrants fetch failed for ${racePath}: ${response.statusText}`);
      return reply.status(response.status).send({
        error: `Error fetching data: ${response.statusText}`
      });
    }

    const data = await response.json();

    // Parser les entrants
    const entrants = data.entrants.map(entrant => {
      const parsedEntrant = {
        user: entrant.user.name,
        status: entrant.status.value,
        finishTime: null,
        dnfTime: null
      };

      // Parser le temps de finish (format ISO 8601: P0DT3H10M22.356246S)
      if (entrant.finish_time) {
        parsedEntrant.finishTime = parseDuration(entrant.finish_time);
      }

      // Pour les DNF, calculer le temps depuis le début (non utilisé actuellement)
      if (entrant.status.value === 'dnf' && entrant.actions && entrant.actions.length > 0) {
        const dnfAction = entrant.actions
          .filter(action => action.action === 'done' && entrant.status.value === 'dnf')
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

        if (dnfAction) {
          const raceStart = new Date(data.started_at);
          const dnfTimestamp = new Date(dnfAction.timestamp);
          parsedEntrant.dnfTime = Math.floor((dnfTimestamp - raceStart) / 1000);
        }
      }

      return parsedEntrant;
    });

    const result = {
      raceName: data.goal.name,
      status: data.status.value,
      startedAt: data.started_at,
      entrants: entrants.sort((a, b) => {
        if (a.finishTime && b.finishTime) return a.finishTime - b.finishTime;
        if (a.finishTime) return -1;
        if (b.finishTime) return 1;
        return 0;
      })
    };

    const doneCount = entrants.filter(e => e.status === 'done').length;
    const dnfCount = entrants.filter(e => e.status === 'dnf').length;
    fastify.log.info(`✓ Race simulator data for ${racePath}: ${entrants.length} entrants (${doneCount} finished, ${dnfCount} DNF)`);

    return result;
  } catch (error) {
    fastify.log.error(`✗ Error fetching entrants for ${racePath}:`, error.message);
    return reply.status(500).send({
      error: 'Error fetching data',
      details: error.message
    });
  }
});

// Fonction pour parser une durée ISO 8601 (P0DT3H10M22.356246S) en secondes
function parseDuration(duration) {
  // Format: P[n]D[T[n]H[n]M[n[.n]]S]
  const matches = duration.match(/P(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/);
  if (!matches) return 0;

  const hours = parseInt(matches[1] || 0);
  const minutes = parseInt(matches[2] || 0);
  const seconds = parseFloat(matches[3] || 0);

  return Math.floor(hours * 3600 + minutes * 60 + seconds);
}

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
