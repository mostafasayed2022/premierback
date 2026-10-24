const path = require("node:path");

const projectDir = __dirname;
const gunicorn = path.resolve(projectDir, "../venv/bin/gunicorn");

module.exports = {
  apps: [
    {
      name: "premier-backend",
      cwd: projectDir,
      script: gunicorn,
      args: "--config gunicorn.conf.py premierhealthcare.wsgi:application",
      interpreter: "none",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: "10s",
      kill_timeout: 10000,
      listen_timeout: 15000,
      time: true,
      merge_logs: true
    }
  ]
};
