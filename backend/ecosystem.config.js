module.exports = {
  apps: [
    {
      name: 'nomadme-backend',
      script: './dist/server.js',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
