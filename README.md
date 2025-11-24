# Industrial Machines & Robotics Ecommerce (DIT312)

A full‑stack ecommerce demo for industrial machines and robotics with CI/CD:

- Backend: Node.js + Express + Postgres
- Frontend: Nginx‑served static SPA
- Database: Postgres with seed data
- Admin: Adminer web UI
- Container orchestration: Docker Compose
- CI/CD: Jenkins declarative pipeline

## Quick Start (macOS, Docker Desktop)

1. Copy env:
   - `cp .env.example .env`
2. Build:
   - `PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH" docker compose -f docker-compose.yml --env-file .env build`
3. Run:
   - `PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH" docker compose -f docker-compose.yml --env-file .env up -d`
4. Verify:
   - API health: `curl http://localhost:3000/health`
   - Categories: `curl http://localhost:3000/categories`
   - Products: `curl http://localhost:3000/products`
   - Frontend: open `http://localhost:8080/`
   - Adminer: open `http://localhost:8081/`
     - System: `PostgreSQL`
     - Server: `db`
     - Username: `POSTGRES_USER` from `.env`
     - Password: `POSTGRES_PASSWORD` from `.env`
     - Database: `POSTGRES_DB` from `.env`

## Features

- Catalog with categories, product filtering and detail.
- Cart and checkout with customer details persisted.
- Payment confirmation page (demo) posting to `/payments`.
- Adminer UI to explore DB.

## UTM Ubuntu VM Setup

1. SSH into VM:
   - `ssh u6702725@127.0.0.1`
2. Install Docker Engine + Compose:
   - `sudo apt-get update`
   - `sudo apt-get install -y ca-certificates curl gnupg`
   - `sudo install -m 0755 -d /etc/apt/keyrings`
   - `curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg`
   - `echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release; echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null`
   - `sudo apt-get update`
   - `sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin`
   - `sudo usermod -aG docker $USER` (log out/in)
3. Clone repo and run:
   - `git clone <your-repo-url>`
   - `cd <repo>`
   - `cp .env.example .env`
   - `docker compose -f docker-compose.yml --env-file .env build`
   - `docker compose -f docker-compose.yml --env-file .env up -d`
4. Verify on VM:
   - API: `curl http://localhost:3000/health`
   - Frontend: open `http://localhost:8080/`
   - Adminer: open `http://localhost:8081/`

## Git Transfer

- On Mac:
  - `git init`
  - `git add .`
  - `git commit -m "Industrial ecommerce: UI, customers, checkout, payments, Adminer, CI/CD"`
  - `git remote add origin <your-repo-url>`
  - `git push -u origin main`
- On VM:
  - `git clone <your-repo-url>` and follow VM run steps.

## Jenkins CI/CD on VM

1. Install Jenkins:
   - `sudo apt-get install -y openjdk-17-jdk`
   - `curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null`
   - `echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null`
   - `sudo apt-get update && sudo apt-get install -y jenkins`
   - `sudo systemctl enable --now jenkins`
   - `sudo usermod -aG docker jenkins && sudo systemctl restart jenkins`
2. Configure Pipeline:
   - New Item → Pipeline
   - Pipeline from SCM → Git → set repo URL/creds
   - Script Path: `Jenkinsfile`
   - Build triggers: SCM polling or webhooks
3. Pipeline stages (already in `Jenkinsfile`):
   - Checkout → Build (`docker compose build`) → Deploy (`docker compose up -d`) → Health checks (`curl` API, frontend, Adminer)

## Endpoints

- `GET /health` – service status
- `GET /categories` – list categories
- `GET /products` – list products, filter by `category` or `category_id`
- `GET /products/:id` – product details
- `POST /orders` – create order with `customer` and `items`
- `GET /orders/:id` – order summary
- `POST /payments` – confirm payment for `order_id`

## Notes

- If database schema updates don’t appear, reset volumes: `docker compose down -v` then rebuild.
- Frontend uses Nginx to proxy `/api/*` to the API container, so browser calls are `http://localhost:8080/api/...`.