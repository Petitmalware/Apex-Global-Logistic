const appRoot = __dirname;
const fromRoot = (...segments) => [appRoot, ...segments].join("/");

module.exports = {
  apps: [
    {
      cwd: appRoot,
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || "3000",
      },
      error_file: fromRoot("logs", "pm2-error.log"),
      exec_mode: "cluster",
      instances: process.env.PM2_INSTANCES || 1,
      max_memory_restart: "768M",
      merge_logs: true,
      name: "apex-global-logistics",
      out_file: fromRoot("logs", "pm2-output.log"),
      script: fromRoot(".next", "standalone", "server.js"),
      time: true,
    },
  ],
};
