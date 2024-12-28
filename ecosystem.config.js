module.exports = {
  apps: [
    {
      name: 'english-chunks',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: '1',
      exec_mode: 'cluster',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
      },
    },
  ],
}; 