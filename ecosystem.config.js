module.exports = {
  apps: [{
    name: 'likeslack',
    script: 'server.js',
    watch: false,
    max_memory_restart: '500M',
    env: {
      PORT: 3333,
      NODE_ENV: 'production',
    },
  }],
};
