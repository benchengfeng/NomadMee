module.exports = {
  apps: [
    {
      name: 'server',
      script: './dist/server.js',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
