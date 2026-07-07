// PM2 process definitions for Miss Khalifa AI.
//
//   pm2 start ecosystem.config.js
//   pm2 save && pm2 startup   # persist across reboots
//
// Assumes (see DEPLOY.md):
//   - backend/.venv exists with requirements installed
//   - frontend has been built:  npm ci && npm run build
//   - nginx reverse-proxies / -> :6000 and /api/ -> :6001
module.exports = {
  apps: [
    {
      name: 'misskhalifa-backend',
      cwd: './backend',
      script: './run.sh',
      interpreter: 'bash',
      autorestart: true,
      max_restarts: 10,
      // OPENAI_API_KEY is read from backend/.env via python-dotenv,
      // so it does not need to be duplicated here.
      env: {
        PYTHONUNBUFFERED: '1',
      },
    },
    {
      name: 'misskhalifa-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run start',
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: '6000',
        // Same-origin default; nginx proxies /api/ to the backend.
        // Note: NEXT_PUBLIC_* is inlined at BUILD time, so also set this
        // (or frontend/.env.production) before `npm run build` if overriding.
        NEXT_PUBLIC_API_URL: '/api/v1',
      },
    },
  ],
}
