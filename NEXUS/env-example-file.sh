# Nexus n8n AI Workflow Automation Hub
# Environment configuration file

# ----------------------------------------
# Core Configuration
# ----------------------------------------

# N8N Host & Security
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_ENCRYPTION_KEY=your-random-32-char-encryption-key
N8N_DIAGNOSTICS=false
N8N_LOG_LEVEL=info
N8N_LOG_OUTPUT=console

# Webhook Configuration
WEBHOOK_URL=http://localhost:5678/
N8N_PUSH_BACKEND=websocket

# Database Configuration
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=change-this-password

# Task Execution Configuration
EXECUTIONS_MODE=queue
QUEUE_BULL_REDIS_HOST=redis
QUEUE_BULL_PREFIX=nexus-n8n
N8N_METRICS=true

# ----------------------------------------
# AI Services Configuration
# ----------------------------------------

# AI Integration
N8N_AI_ENABLED=true

# OpenAI API
OPENAI_API_KEY=your-openai-api-key
OPENAI_ORG_ID=your-openai-org-id

# LangChain Configuration
LANGCHAIN_TRACING_V2=false
LANGCHAIN_API_KEY=your-langchain-api-key
LANGCHAIN_PROJECT=nexus-n8n

# Hugging Face
HUGGINGFACE_API_KEY=your-huggingface-api-key

# ----------------------------------------
# Integration Services
# ----------------------------------------

# Twitter/X API
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
TWITTER_ACCESS_TOKEN=your-twitter-access-token
TWITTER_ACCESS_SECRET=your-twitter-access-secret

# Slack
SLACK_TOKEN=your-slack-token
SLACK_WEBHOOK_URL=your-slack-webhook-url

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_SENDER=noreply@example.com

# ----------------------------------------
# Infrastructure Configuration
# ----------------------------------------

# Docker & Nginx
DOMAIN_NAME=n8n.example.com
NGINX_SSL=false

# Monitoring
GRAFANA_PASSWORD=admin

# Resource Limits
CONTAINER_CPU_LIMIT=1000m
CONTAINER_MEMORY_LIMIT=2Gi
CONTAINER_CPU_REQUEST=200m
CONTAINER_MEMORY_REQUEST=512Mi

# ----------------------------------------
# Advanced Configuration
# ----------------------------------------

# User Settings
N8N_DEFAULT_USER_NAME=admin
N8N_DEFAULT_USER_PASSWORD=change-this-password
N8N_DISABLE_PRODUCTION_MAIN_PROCESS=false

# Performance Optimization
NODE_FUNCTION_ALLOW_EXTERNAL=true
GENERIC_TIMEZONE=UTC
N8N_BLOCK_ENV_ACCESS_IN_NODE_EXECUTION=false
N8N_DISABLE_EXTERNAL_HOOKS=false

# Security Settings
N8N_JWT_SECRET=your-jwt-secret
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=change-this-password
