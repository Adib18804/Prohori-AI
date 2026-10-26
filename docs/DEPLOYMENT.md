# Prohori AI Deployment Guide

Complete guide for deploying Prohori AI in development, staging, and production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Deployment](#development-deployment)
3. [Production Deployment](#production-deployment)
4. [Cloud Deployment](#cloud-deployment)
5. [Configuration](#configuration)
6. [Security Hardening](#security-hardening)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required

- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **PostgreSQL** 15+ with pgvector (included in docker-compose)
- **API Keys**:
  - OpenAI API key (or)
  - Anthropic API key (or both)

### Optional

- **Domain name** for production
- **SSL certificate** for HTTPS
- **Monitoring tools** (Prometheus, Grafana)

## Development Deployment

### Quick Start

```bash
# 1. Clone repository
git clone <repo-url>
cd prohori-ai

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env with your API keys
nano .env  # or any editor

# 4. Start all services
docker-compose up -d

# 5. Check status
docker-compose ps

# 6. View logs
docker-compose logs -f
```

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432

### Development Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Restart a service
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build

# Access backend shell
docker-compose exec backend bash

# Access database
docker-compose exec postgres psql -U postgres -d prohori
```

## Production Deployment

### Option 1: Docker Compose (Recommended for Single Server)

#### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

#### Step 2: Clone and Configure

```bash
# Clone repository
git clone <repo-url>
cd prohori-ai

# Copy production environment template
cp .env.example .env

# Edit with production values
nano .env
```

**Important Environment Variables:**

```bash
# Database
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@postgres:5432/prohori
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE

# AI Models
OPENAI_API_KEY=sk-your-production-key
ANTHROPIC_API_KEY=sk-ant-your-production-key

# Security
JWT_SECRET=LONG_RANDOM_STRING_GENERATE_WITH_openssl_rand_-hex_32
AUTO_BLOCK_THRESHOLD=0.90
DEBATE_THRESHOLD=0.70

# Environment
PYTHON_ENV=production
NODE_ENV=production
LOG_LEVEL=INFO
```

#### Step 3: Generate Secrets

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate strong postgres password
openssl rand -base64 32
```

#### Step 4: Deploy

```bash
# Start production stack
docker compose -f docker-compose.prod.yml up -d

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Verify services are healthy
docker compose -f docker-compose.prod.yml ps
```

#### Step 5: Initialize Database

```bash
# Run migrations
docker compose exec backend python -m app.database.init_db

# Create admin user (optional)
docker compose exec backend python -c "
from app.services.auth_service import AuthService
from app.database import get_db
db = next(get_db())
AuthService.register_user(db, 'admin@example.com', 'STRONG_PASSWORD', 'Admin')
"
```

#### Step 6: Train ML Classifier (Optional)

```bash
# Generate dataset
docker compose exec backend bash -c "cd /app/attack-dataset && python generate_dataset.py"

# Train classifier
docker compose exec backend python train_ml_classifier.py
```

### Option 2: Kubernetes

See [KUBERNETES_DEPLOYMENT.md](./KUBERNETES_DEPLOYMENT.md) for detailed K8s deployment guide.

### Option 3: Manual Deployment

#### Backend

```bash
cd backend

# Install dependencies
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Set environment
export DATABASE_URL=postgresql://...
export OPENAI_API_KEY=sk-...
# ... other env vars

# Run with gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Serve with nginx or any static server
# Copy dist/ contents to web server root
```

#### Database

```bash
# Install PostgreSQL with pgvector
sudo apt install postgresql-15 postgresql-15-pgvector

# Create database
sudo -u postgres psql
CREATE DATABASE prohori;
CREATE USER prohori_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE prohori TO prohori_user;

# Load schema
psql -U prohori_user -d prohori -f database/schema.sql
```

## Cloud Deployment

### AWS Deployment

#### Using ECS (Elastic Container Service)

1. **Push Images to ECR**

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t prohori-backend ./backend
docker tag prohori-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/prohori-backend:latest

# Push
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/prohori-backend:latest
```

2. **Create ECS Task Definitions**

See `deployment/aws/ecs-task-definition.json`

3. **Deploy to ECS**

```bash
aws ecs create-service \
  --cluster prohori-cluster \
  --service-name prohori-backend \
  --task-definition prohori-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE
```

#### Using RDS for Database

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier prohori-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --master-username postgres \
  --master-user-password <strong-password> \
  --allocated-storage 20 \
  --storage-type gp3

# Install pgvector extension
psql -h prohori-db.xxxxx.rds.amazonaws.com -U postgres
CREATE EXTENSION vector;
```

### Google Cloud Platform

#### Using Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/prohori-backend ./backend

# Deploy to Cloud Run
gcloud run deploy prohori-backend \
  --image gcr.io/PROJECT_ID/prohori-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=postgresql://...,OPENAI_API_KEY=sk-...
```

#### Using Cloud SQL

```bash
# Create Cloud SQL instance
gcloud sql instances create prohori-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create prohori --instance=prohori-db
```

### Azure

#### Using Container Instances

```bash
# Create resource group
az group create --name prohori-rg --location eastus

# Deploy backend
az container create \
  --resource-group prohori-rg \
  --name prohori-backend \
  --image <your-registry>/prohori-backend:latest \
  --dns-name-label prohori-backend \
  --ports 8000 \
  --environment-variables DATABASE_URL=... OPENAI_API_KEY=...
```

### DigitalOcean

#### Using App Platform

1. Connect GitHub repository
2. Configure build settings:
   - Backend: Dockerfile in `./backend`
   - Frontend: Dockerfile in `./frontend`
3. Add environment variables
4. Deploy

## Configuration

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes* | - | OpenAI API key |
| `ANTHROPIC_API_KEY` | Yes* | - | Anthropic API key |
| `JWT_SECRET` | Yes | - | Secret for JWT signing |
| `EMBEDDING_MODEL` | No | `text-embedding-3-small` | OpenAI embedding model |
| `TRIAGE_MODEL` | No | `gpt-4o-mini` | Triage agent model |
| `PROSECUTOR_MODEL` | No | `gpt-4o` | Prosecutor agent model |
| `DEFENDER_MODEL` | No | `gpt-4o` | Defender agent model |
| `JUDGE_MODEL` | No | `gpt-4o` | Judge agent model |
| `AUTO_BLOCK_THRESHOLD` | No | `0.90` | Automatic block threshold |
| `DEBATE_THRESHOLD` | No | `0.70` | Debate trigger threshold |
| `ENABLE_ML_CLASSIFIER` | No | `false` | Enable ML classifier |
| `ENABLE_RAG_MEMORY` | No | `true` | Enable RAG attack memory |
| `MAX_PROMPT_LENGTH` | No | `10000` | Max prompt characters |
| `REQUESTS_PER_MINUTE` | No | `60` | Rate limit per user |
| `LOG_LEVEL` | No | `INFO` | Logging level |

\* At least one AI provider key required

### Database Connection Strings

```bash
# Local development
DATABASE_URL=postgresql://postgres:password@localhost:5432/prohori

# Docker
DATABASE_URL=postgresql://postgres:password@postgres:5432/prohori

# Production (SSL)
DATABASE_URL=postgresql://user:pass@host:5432/prohori?sslmode=require
```

### Scaling Configuration

#### Horizontal Scaling (Multiple Instances)

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 4  # Run 4 backend instances
```

#### Vertical Scaling (Resource Limits)

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

## Security Hardening

### 1. Use HTTPS

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

### 2. Configure Firewall

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 3. Secure Database

```sql
-- Create read-only user for analytics
CREATE USER prohori_readonly WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE prohori TO prohori_readonly;
GRANT USAGE ON SCHEMA public TO prohori_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO prohori_readonly;
```

### 4. Environment Secrets

Never commit `.env` files. Use secret management:

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name prohori/prod/env \
  --secret-string file://.env

# Read in application
aws secretsmanager get-secret-value --secret-id prohori/prod/env
```

### 5. Enable Authentication

Always enable authentication in production:

```python
# All endpoints should require auth
from app.api.deps import get_current_user

@router.post("/protect")
async def protect(
    request: ProtectRequest,
    current_user = Depends(get_current_user)  # ← Required
):
    ...
```

### 6. Rate Limiting

Configure aggressive rate limits:

```python
# app/config.py
REQUESTS_PER_MINUTE = 20  # Production: lower limit
DEBATES_PER_HOUR = 50
```

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:8000/api/v1/ops/health

# Expected response
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "ai_services": "available"
}
```

### Logging

```bash
# View live logs
docker compose logs -f backend

# Export logs
docker compose logs backend > backend.log

# Search logs
docker compose logs backend | grep ERROR
```

### Metrics (Prometheus)

Add to `docker-compose.prod.yml`:

```yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Alerting

Configure alerts for:
- High error rate (>5%)
- Slow response times (>5s)
- Database connection failures
- API key rate limits

## Backup & Recovery

### Database Backup

```bash
# Manual backup
docker compose exec postgres pg_dump -U postgres prohori > backup_$(date +%Y%m%d).sql

# Automated daily backup (cron)
0 2 * * * docker compose exec postgres pg_dump -U postgres prohori > /backups/backup_$(date +\%Y\%m\%d).sql
```

### Restore

```bash
# Restore from backup
docker compose exec -T postgres psql -U postgres prohori < backup_20240101.sql
```

### Data Migration

```bash
# Export from old instance
pg_dump -h old-host -U postgres prohori > migration.sql

# Import to new instance
psql -h new-host -U postgres prohori < migration.sql
```

## Troubleshooting

### Issue: Backend won't start

**Check logs:**
```bash
docker compose logs backend
```

**Common causes:**
- Missing environment variables
- Database not ready
- Invalid API keys

**Solution:**
```bash
# Verify .env file
cat .env

# Check database
docker compose exec postgres psql -U postgres -c "SELECT 1"

# Test API keys
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

### Issue: Database connection failed

**Check connection:**
```bash
docker compose exec backend python -c "
from app.database import engine
with engine.connect() as conn:
    print('Connected!')
"
```

**Solution:**
```bash
# Restart database
docker compose restart postgres

# Check network
docker network inspect prohori-ai_default
```

### Issue: High memory usage

**Monitor resources:**
```bash
docker stats
```

**Solution:**
```bash
# Add resource limits
# See docker-compose.prod.yml for limits configuration

# Or scale down
docker compose -f docker-compose.prod.yml up -d --scale backend=2
```

### Issue: Slow performance

**Profile requests:**
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Check processing times in logs
docker compose logs backend | grep "processing_time_ms"
```

**Solutions:**
- Enable RAG memory for faster pattern matching
- Train ML classifier for fast lane
- Increase worker count
- Use faster LLM models for triage

## Production Checklist

- [ ] Strong passwords for all services
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules configured
- [ ] Database backups automated
- [ ] Monitoring and alerting setup
- [ ] Rate limiting configured
- [ ] Authentication enabled on all endpoints
- [ ] Environment variables secured
- [ ] Logs centralized
- [ ] Health checks configured
- [ ] Auto-restart policies set
- [ ] Resource limits configured
- [ ] API keys rotated
- [ ] Security headers configured
- [ ] CORS properly configured

## Support

For deployment issues:
1. Check logs: `docker compose logs -f`
2. Review health check: `/api/v1/ops/health`
3. Consult documentation
4. Open GitHub issue with logs

## Updates

To update to a new version:

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Run any migrations
docker compose exec backend python -m app.database.init_db
```

## License

See main repository LICENSE file.
