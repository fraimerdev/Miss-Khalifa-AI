# Deploying Miss Khalifa AI to a VPS

Two processes managed by **PM2**, fronted by **nginx** with HTTPS:

```
                 ┌─────────── nginx (:80 / :443, your domain) ───────────┐
   Internet ───▶ │   /      → 127.0.0.1:3000  (Next.js frontend)         │
                 │   /api/  → 127.0.0.1:5000  (Flask backend via gunicorn)│
                 └────────────────────────────────────────────────────────┘
```

Because nginx serves the API on the same origin (`/api/`), the frontend talks to
`/api/v1/chat` — no CORS or mixed-content issues.

---

## 0. Prerequisites on the VPS

```bash
# Node 18+ (for Next.js 14) and PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Python 3.10+ and nginx
sudo apt-get install -y python3 python3-venv python3-pip nginx
```

## 1. Get the code

```bash
cd /opt   # or wherever you keep apps
git clone <your-repo-url> misskhalifa
cd misskhalifa
```

## 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
deactivate

# secrets
cp .env.example .env
nano .env        # paste your real OPENAI_API_KEY

chmod +x run.sh
cd ..
```

> On first start the backend calls the OpenAI **embeddings** API to build the
> FAISS vector store from the CSVs in `backend/data/questions`. This costs a few
> cents and takes a few seconds. `--preload` in `run.sh` makes it happen once.

## 3. Frontend

```bash
cd frontend
npm ci
# same-origin default already works with nginx; override only if needed:
# cp .env.example .env.production
npm run build
cd ..
```

## 4. Start both with PM2

```bash
pm2 start ecosystem.config.js
pm2 save            # remember the process list
pm2 startup         # print the command to enable PM2 on boot — run what it says
pm2 status
pm2 logs            # verify both came up cleanly
```

## 5. nginx + HTTPS

```bash
# edit server_name to your real domain first
nano deploy/nginx.conf

sudo cp deploy/nginx.conf /etc/nginx/sites-available/misskhalifa
sudo ln -s /etc/nginx/sites-available/misskhalifa /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # optional: drop the default site
sudo nginx -t && sudo systemctl reload nginx
```

Point your domain's **A record** at the VPS IP, then get a certificate:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example.com
```

certbot edits the nginx file to add the `:443` SSL server block and a
`:80 → :443` redirect, and sets up auto-renewal. Reload once more if prompted.

Open `https://your-domain.example.com` — the chat should work end to end.

---

## Updating after a code change

```bash
cd /opt/misskhalifa
git pull

# backend deps changed?
cd backend && source .venv/bin/activate && pip install -r requirements.txt && deactivate && cd ..

# frontend changed? rebuild (Next.js needs a fresh build to serve new code)
cd frontend && npm ci && npm run build && cd ..

pm2 restart ecosystem.config.js
```

## Firewall note

Only expose 80/443. The app ports 3000 and 5000 bind to `127.0.0.1` only, so
they aren't reachable from outside — nginx is the single public entrypoint.

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Troubleshooting

- `pm2 logs misskhalifa-backend` — backend not starting is almost always a
  missing/invalid `OPENAI_API_KEY` in `backend/.env`.
- `pm2 logs misskhalifa-frontend` — if the chat 404s on `/api/v1/chat`, check the
  nginx `/api/` block is active (`sudo nginx -t`, `curl -s localhost:5000/api/v1/chat`).
- Backend writes user questions to `backend/data/user_inputs.csv`; make sure the
  PM2 user can write there.

## Security follow-ups (recommended, not required to boot)

- **Rotate the ElevenLabs key** in `frontend/src/lib/textospeech.ts`. It is
  hardcoded and present in git history, so treat it as compromised. That file is
  currently unused by the UI; if/when you wire it up, move the key to an env var.
