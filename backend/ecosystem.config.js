module.exports = {
  apps: [
    {
      name: 'backend-service', // The name of your PM2 service
      script: './dist/index.js', // The main file of your backend in the dist folder
      watch: ['./dist'], // Watch changes in the dist folder for automatic restarts
      env: {
        NODE_ENV: 'production', // Environment variables for production
      },
    },
  ],
};
