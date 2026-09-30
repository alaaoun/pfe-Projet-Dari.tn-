// ecosystem.config.js — PM2 process manager
// Lancement : pm2 start ecosystem.config.js --env production
// ou via deploy.sh (automatique)

module.exports = {
  apps: [
    {
      name: 'dari-api',
      script: './src/server.js',

      // Cluster : 1 worker par CPU (max 4 sur VPS small)
      instances: 'max',
      exec_mode: 'cluster',

      // Redémarrage automatique si mémoire > 512 Mo
      max_memory_restart: '512M',

      // Variables d'environnement (le .env est chargé par dotenv dans server.js)
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Logs
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      // Redémarrage
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Monitoring
      watch: false,
    },
  ],
};
