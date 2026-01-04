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

// Fonction pour convertir CamelCase en snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2');
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
    // Hash (avant le |) - enlever le préfixe "Hash" et convertir en snake_case
    const hashPart = parts[0].trim();
    result.hash = hashPart
      .split(/\s+/)
      .filter(item => item && item.startsWith('Hash'))
      .map(item => toSnakeCase(item.replace(/^Hash/, '')));

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
        error: `Erreur lors de la récupération des données: ${response.statusText}`
      });
    }

    const data = await response.json();

    // Vérifier que info_bot existe
    if (!data.info_bot) {
      return reply.status(400).send({
        error: 'Aucune information info_bot trouvée dans les données'
      });
    }

    // Parser et retourner les données formatées
    const parsedData = parseInfoBot(data.info_bot);
    return parsedData;
  } catch (error) {
    fastify.log.error('Error fetching race data:', error);
    return reply.status(500).send({
      error: 'Erreur lors de la récupération des données',
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
