module.exports = {
  apps: [
    {
      name: 'xinlong-site',
      cwd: '.',
      // Run Next.js in production mode
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      // Keep a single instance to avoid port contention; raise if you add a reverse proxy with sticky sessions
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      restart_delay: 1000,
      max_memory_restart: '512M',
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
}
