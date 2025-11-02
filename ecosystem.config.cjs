module.exports = {
  apps: [
    {
      name: 'trainium-web',
      cwd: './apps/web',
      script: 'pnpm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: '3000' }
    },
    {
      name: 'trainium-socket',
      cwd: './apps/socket',
      script: 'pnpm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: '4000' }
    }
  ]
}
