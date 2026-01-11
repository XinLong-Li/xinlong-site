module.exports = {
  apps: [
    {
      name: 'xinlong-site',
      cwd: '.',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1, // set to 'max' to use all cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
