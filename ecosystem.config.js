module.exports = {
  apps: [
    {
      name: 'xinlong-site',

      // cwd 用 __dirname 而不是 '.'：'.' 是相对 PM2 daemon 的工作目录解析的，
      // 而 PM2 daemon 的 cwd 取决于它当初是在哪里启动的。用绝对路径消除这个
      // 变量。server.js 自己也会 process.chdir(__dirname)，两道保险。
      cwd: __dirname,

      // **standalone 产物自带的入口，不是 next CLI。**
      //
      // 部署方式已改成「在 GitHub runner 上构建 → 推产物」，服务器上不再有
      // npm ci / next build，因此 node_modules/.bin/next 也不保证存在。
      // server.js 是 Next 为 standalone 输出生成的入口，内部会读环境变量
      // PORT / HOSTNAME，并且以自身所在目录为根（所以 content/ 必须在旁边）。
      script: 'server.js',

      // 单实例，避免端口争用；将来加带粘性会话的反向代理再调大
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      restart_delay: 1000,
      max_memory_restart: '512M',
      kill_timeout: 5000,

      // 这里**刻意不放 .env 里的那三个键**。
      //
      // server.js 走的是 Next 的 BaseServer，构造时会无条件调用
      // loadEnvConfig(dir)，dir 就是 server.js 所在目录 —— 也就是这个项目根，
      // .env 正好在那里。所以 ADMIN_PASSWORD_HASH / SESSION_SECRET /
      // SITE_SYNC_TOKEN 由 Next 自己读进 process.env，不需要 PM2 代劳。
      // （next/dist/server/base-server.js 里 loadEnvConfig 那行没有
      //   minimalMode 判断，standalone 下同样会执行。）
      //
      // 把这个包进 PM2 反而会引入优先级歧义：一旦某天 .env 和这里不一致，
      // 谁赢取决于 PM2 的加载时机，而症状是"密码明明改了却登不上"。
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
