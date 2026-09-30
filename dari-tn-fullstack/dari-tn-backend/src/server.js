'use strict';

require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Connexion PostgreSQL établie');

    // En développement : sync auto. En prod : utiliser les migrations
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('✅ Modèles synchronisés (dev)');
    }

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Dari.tn API démarrée sur le port ${PORT}`);
      logger.info(`🌍 Environnement : ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('❌ Impossible de démarrer le serveur :', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM reçu — arrêt propre...');
  await sequelize.close();
  process.exit(0);
});

startServer();
