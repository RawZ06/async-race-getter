const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Endpoint pour récupérer les données de racetime.gg
app.get('/api/race/*', async (req, res) => {
  // Récupérer tout ce qui vient après /api/race/
  const racePath = req.params[0];

  try {
    // Construire l'URL racetime.gg
    const url = `https://racetime.gg/${racePath}/data`;

    console.log(`Fetching data from: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Erreur lors de la récupération des données: ${response.statusText}`
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching race data:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des données',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Open your browser to get started!`);
});
