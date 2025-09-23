
# Vivsoft Document Manager (Full‑Stack • Docker • AWS)

A lightweight **document management system** that lets users upload, list, share, and securely download files.
It’s split into a static **frontend** (HTML/JS served by Nginx) and a Node.js/Express **backend** with **MongoDB** for metadata and **AWS S3** for file storage. The repo includes **Docker** setup for local use and a **GitHub Actions CI/CD** that builds and pushes images to **Amazon ECR** for deployment on **EC2**. Infrastructure can be provisioned with **Terraform** (EC2 and optional RDS module included for future expansion).

> **Swagger docs:** the backend exposes interactive API docs at `/api-docs` when running (e.g. `http://localhost:3001/api-docs`).

---

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Repo Layout](#repo-layout)
- [Quickstart (Local)](#quickstart-local)
  - [Option A — Docker Compose](#option-a--docker-compose)
  - [Option B — Run without Docker](#option-b--run-without-docker)
- [Configuration](#configuration)
- [API (Quick View)](#api-quick-view)
- [Testing](#testing)
- [CI/CD (GitHub Actions → ECR → EC2)](#cicd-github-actions--ecr--ec2)
- [Terraform (EC2 & optional RDS)](#terraform-ec2--optional-rds)
- [S3 Notes (Bucket & CORS)](#s3-notes-bucket--cors)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [License](#license)

---

## Architecture

```
[ Browser ]
    │
    ▼
[ Frontend (Nginx, static HTML/CSS/JS) ]
    │ calls
    ▼
[ Backend (Node.js + Express) ] ──► [ MongoDB (document metadata) ]
    │
    └────────────── presigned URLs ──► [ AWS S3 (file storage) ]

Infra & Delivery:
- Docker images for frontend/backend
- Pushed to Amazon ECR via GitHub Actions
- Deployed to EC2 (docker-compose)
- Terraform modules for EC2 (+ optional RDS)
```

---

## Features

- 📄 **Upload** documents to S3 (with type/size validation)
- 📚 **List & search** documents (filter by user; basic keyword filtering in UI)
- 🔐 **Secure download** via **presigned S3 URLs**
- 👥 **Share** documents with users (read/write flag stored in MongoDB)
- 📊 **Stats**: download counts & last accessed timestamps
- 🧪 **Backend tests** with Jest + `mongodb-memory-server`
- 🧰 **Containerized**: Dockerfiles for both services + Compose for local
- 🚀 **CI/CD**: GitHub Actions build → push to ECR → remote deploy to EC2
- 🧱 **Terraform**: EC2 module provided (RDS module included for future needs)

---

## Repo Layout

```
document-manager-develop-2/
├─ frontend/                 # Static UI (Nginx)
│  ├─ Dockerfile
│  ├─ index.html
│  ├─ app.js
│  └─ style.css
├─ backend/                  # REST API (Express + Mongoose)
│  ├─ Dockerfile
│  ├─ package.json
│  ├─ jest.config.js
│  └─ src/
│     ├─ index.js            # API routes, Mongoose models, S3 logic, Swagger
│     ├─ index.test.js       # Jest API tests (mongodb-memory-server)
│     └─ test-setup.js
├─ terraform/                # IaC for AWS
│  ├─ main.tf
│  ├─ variables.tf
│  ├─ outputs.tf
│  ├─ terraform.tfvars.example
│  ├─ modules/
│  │  ├─ ec2/
│  │  └─ rds/                # Included (not required by current backend)
│  └─ deploy.sh              # Helper script (plan/apply/destroy wrappers)
├─ .github/workflows/ci-cd.yml  # Build images & deploy to EC2
├─ docker-compose.yml        # Production-style compose pulling ECR images
└─ README.md                 # You are here
```

---

## Quickstart (Local)

### Option A — Docker Compose

> Best for testing the full stack with containers. This starts **MongoDB**, the **backend** (port `3001`), and the **frontend** (port `80`).

1) **Create an env file for the backend** (e.g. `backend/.env`):

```env
# backend/.env
PORT=3001
MONGO_URL=mongodb://mongo:27017/vivsoft_documents
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=your-s3-bucket-name
AWS_ACCESS_KEY_ID=your-access-key-id        # for local dev only; prefer IAM role in prod
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

2) **(Optional but recommended)**: add an override so the backend container receives env vars:

Create `docker-compose.override.yml` at repo root:

```yaml
services:
  backend:
    env_file:
      - ./backend/.env
```

3) **Start the stack** at the repo root:

```bash
docker compose up -d    # or: docker-compose up -d
```

4) Verify:
- Frontend → http://localhost/
- Backend health → http://localhost:3001/health
- Swagger → http://localhost:3001/api-docs

### Option B — Run without Docker

Run MongoDB via Docker, then start backend with Node for easier debugging.

```bash
# 1) Start MongoDB only
docker run -d --name mongo -p 27017:27017 mongo:latest

# 2) Backend
cd backend
cp .env.example .env   # if you create one, else set env as in Option A
npm install
npm start              # starts on PORT (default 3001)

# 3) Frontend
# Serve the static frontend (choose one):
#   - open frontend/index.html directly, or
#   - npx serve ./frontend (then visit printed URL)
```

---

## Configuration

### Backend Environment Variables

| Variable                | Required | Default                                     | Notes |
|-------------------------|----------|---------------------------------------------|-------|
| `PORT`                  | no       | `3001`                                      | API port |
| `MONGO_URL`             | yes      | `mongodb://mongo:27017/vivsoft_documents`   | Mongo connection string |
| `AWS_REGION`            | yes      | `ap-southeast-1`                            | S3 region |
| `S3_BUCKET_NAME`        | yes      | `internship-v1-bucket`                      | Bucket holding documents |
| `AWS_ACCESS_KEY_ID`     | *local*  | —                                           | Use **IAM role** on EC2 instead of static keys |
| `AWS_SECRET_ACCESS_KEY` | *local*  | —                                           | Use **IAM role** on EC2 instead of static keys |

> In production (EC2), prefer attaching an **instance profile/role** that allows S3 access to the target bucket. Remove static keys from the env.

### Frontend Configuration

`frontend/app.js` auto-selects the API base:
- `http://localhost:3001` when developing locally
- `https://your-backend-domain.com` in other cases → **update this to your real backend URL** when deploying

---

## API (Quick View)

All responses are JSON unless downloading. See **Swagger** at `/api-docs` for full schemas.

### Health & Info
- `GET /` → API info & available endpoints
- `GET /health` → `{ status, mongo, s3 }`

### Documents
- `GET /api/documents?user=<email>&public=<true|false>` → list documents (optional filters)
- `POST /api/documents/upload` → multipart upload  
  - field `document` (file), plus body fields: `uploadedBy`, `description?`, `tags?` (comma‑separated), `isPublic?` (`true|false`)
- `GET /api/documents/:id` → fetch single document metadata
- `GET /api/documents/:id/download` → returns **presigned S3 URL** (`downloadUrl`)
- `POST /api/documents/:id/share` → `{ "emails": ["a@x.com","b@y.com"], "permission": "read"|"write" }`
- `DELETE /api/documents/:id` → deletes from S3 and Mongo

### Users
- `GET /api/users` → list users
- `POST /api/users` → `{ name, email, role? }`
- `PUT /api/users/:id` → update `{ name?, email?, role? }`

**Sample upload (curl):**
```bash
curl -X POST http://localhost:3001/api/documents/upload   -F "document=@/path/to/file.pdf"   -F "uploadedBy=jane.doe@example.com"   -F "description=Quarterly report"   -F "tags=finance,q3,confidential"   -F "isPublic=false"
```

---

## Testing

Backend tests use **Jest** with an in‑memory MongoDB.

```bash
cd backend
npm install
npm test
```

---

## CI/CD (GitHub Actions → ECR → EC2)

This repo ships a single workflow at `.github/workflows/ci-cd.yml` that:

1. Runs backend tests.
2. Builds **frontend** and **backend** Docker images.
3. Pushes both images to **Amazon ECR**.
4. SSHes into your **EC2** host and runs `docker-compose` to pull & restart with `:latest`.

**Required GitHub Secrets** (names used in the workflow):

- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- `ECR_REGISTRY` (e.g., `123456789012.dkr.ecr.ap-southeast-1.amazonaws.com`)
- `FRONTEND_ECR_REPOSITORY`, `BACKEND_ECR_REPOSITORY` (ECR repo names)
- `EC2_HOST`, `EC2_USER` (e.g., `ubuntu`), `SSH_PRIVATE_KEY` (PEM contents)

> Ensure Docker & docker-compose are installed on the EC2 host and that the host can pull from your ECR (the workflow logs in to ECR before `docker-compose up -d`).

The production `docker-compose.yml` expects images in the form:

```yaml
services:
  frontend:
    image: ${ECR_REGISTRY}/${FRONTEND_ECR_REPOSITORY}:latest
    ports: ["80:80"]
  backend:
    image: ${ECR_REGISTRY}/${BACKEND_ECR_REPOSITORY}:latest
    ports: ["3001:3001"]
    depends_on: [mongo]
  mongo:
    image: mongo:latest
    ports: ["27017:27017"]
    volumes:
      - mongo-data:/data/db
```

Add `backend` environment via an override file as shown in [Quickstart](#option-a--docker-compose).

---

## Terraform (EC2 & optional RDS)

The `terraform/` folder provides a simple, modular setup for **EC2** (for docker‑compose deployment). An **RDS** module is included but **not required** by the current backend (which uses **MongoDB**). Keep RDS for future refactors or other services.

**Usage:**

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# edit values (region, key_name, instance_type, etc.)

terraform init
terraform plan
terraform apply
```

Or use the helper script:

```bash
./deploy.sh plan    # or: ./deploy.sh apply, ./deploy.sh destroy
```

**Outputs** typically include the EC2 public IP/DNS. Attach an **instance profile** allowing ECR pull + S3 bucket access to avoid static AWS keys on the host.

---

## S3 Notes (Bucket & CORS)

Create an S3 bucket (name must match `S3_BUCKET_NAME`). Give the EC2 instance role permission for `s3:GetObject`, `s3:PutObject`, and `s3:DeleteObject` on `arn:aws:s3:::<bucket>/*`.

**Minimal CORS** (if the browser downloads directly from S3 with the presigned URL):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag","Content-Length","Content-Type"],
    "MaxAgeSeconds": 3000
  }
]
```


---


## Roadmap

- Authentication  user accounts
- Role‑based access & audit logs
- Versioning for documents
- Signed **upload** URLs (browser → S3) to offload backend
- Replace inline models with separate files & controllers
- Observability (structured logs, metrics, tracing)
- Optional move to managed MongoDB (e.g., Atlas) or align Terraform RDS module with an SQL rewrite

