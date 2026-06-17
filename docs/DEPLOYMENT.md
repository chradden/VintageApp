# Deployment auf einem eigenen Server (VPS)

Diese Anleitung bringt VintageApp dauerhaft auf einen eigenen Linux-Server (z. B. Hetzner,
DigitalOcean, Ubuntu 22.04/24.04). Vorteil gegenüber serverlosem Hosting: der datei-basierte
Store der Finanzübersicht (`.data/store.json`, Modul M4) bleibt auf der Festplatte erhalten.

Ergebnis: Die App läuft 24/7 hinter einer eigenen Domain mit HTTPS, startet nach einem
Reboot automatisch und ist auch für die Browser-Erweiterung von überall erreichbar.

> Annahmen: Ubuntu/Debian-Server mit `sudo`-Rechten, SSH-Zugang, optional eine Domain, die
> auf die Server-IP zeigt (für HTTPS). Befehle ggf. an deine Distribution anpassen.

---

## 1. Node.js installieren (Version 20+)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git
node --version   # sollte v22.x zeigen
```

## 2. Code holen & bauen

```bash
# z. B. nach /var/www
sudo mkdir -p /var/www && sudo chown $USER /var/www
cd /var/www
git clone https://github.com/chradden/vintageapp.git
cd vintageapp
npm install
```

## 3. Umgebungsvariablen setzen

Lege eine `.env` im Projektordner an (Next.js liest sie beim Start automatisch):

```bash
cp .env.example .env
nano .env
```

Trage mindestens ein:
- einen LLM-Key: `ANTHROPIC_API_KEY=...` **oder** `OPENROUTER_API_KEY=...` (+ `OPENROUTER_MODEL`)
- `REPLICATE_API_TOKEN=...` (nur für M2, Getragen-Look)
- **`APP_API_KEY=<langes-zufälliges-geheimnis>`** — schützt die KI-Routen (dringend empfohlen, sobald öffentlich erreichbar!)

## 4. Production-Build erstellen

```bash
npm run build
```

Kurzer Test (läuft im Vordergrund, mit Strg+C beenden):

```bash
npm run start    # http://SERVER-IP:3000
```

---

## 5. Dauerhaft laufen lassen mit pm2

[pm2](https://pm2.keymetrics.io/) hält den Prozess am Leben und startet ihn nach Reboot neu.

```bash
sudo npm install -g pm2

# App als "vintageapp" starten (führt 'npm run start' aus -> next start, Port 3000)
pm2 start npm --name vintageapp -- start

pm2 save                 # aktuellen Prozess-Satz merken
pm2 startup              # gibt einen Befehl aus -> diesen kopieren und ausführen
```

Nützliche Befehle:

```bash
pm2 status               # läuft es?
pm2 logs vintageapp      # Logs ansehen
pm2 restart vintageapp   # nach Updates neu starten
```

> Optional anderen Port: `PORT=3001 pm2 start npm --name vintageapp -- start`.

---

## 6. Reverse Proxy mit nginx (Domain + Port 80)

```bash
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/vintageapp
```

Inhalt (Domain anpassen):

```nginx
server {
    listen 80;
    server_name deine-domain.de;

    # Erlaubt größere Foto-Uploads
    client_max_body_size 12M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktivieren:

```bash
sudo ln -s /etc/nginx/sites-available/vintageapp /etc/nginx/sites-enabled/
sudo nginx -t          # Konfiguration prüfen
sudo systemctl reload nginx
```

## 7. HTTPS mit Let's Encrypt (certbot)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d deine-domain.de
```

certbot trägt das Zertifikat automatisch in nginx ein und erneuert es selbstständig.

## 8. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # Ports 80 + 443
sudo ufw enable
```

---

## 9. Updates einspielen

```bash
cd /var/www/vintageapp
git pull
npm install
npm run build
pm2 restart vintageapp
```

---

## 10. Nach dem Deploy: Erweiterung verbinden

In der Browser-Erweiterung unter ⚙︎:
- **Backend-URL:** `https://deine-domain.de`
- **API-Key:** der Wert aus `APP_API_KEY`

Ebenso in der Web-UI das 🔑-Feld mit dem `APP_API_KEY` füllen.

---

## Hinweise

- **Datenpersistenz:** Die Finanzübersicht (M4) speichert in `/var/www/vintageapp/.data/store.json`.
  Diese Datei bleibt auf der Server-Platte erhalten. **Sichere sie regelmäßig** (z. B. per cron
  `cp` oder in ein Backup). Für mehrere parallele Nutzer/echte Skalierung ist später die
  Umstellung auf PostgreSQL/Prisma sinnvoll (siehe `docs/KONZEPT.md`).
- **Secrets:** Die `.env` enthält API-Keys – nicht ins Git committen (ist bereits in `.gitignore`).
- **Ressourcen:** Ein kleiner VPS (1–2 vCPU, 2 GB RAM) genügt; der Build braucht kurzzeitig
  mehr RAM – bei Engpässen `npm run build` lokal/mit Swap ausführen.
