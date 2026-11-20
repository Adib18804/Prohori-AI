FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first (for Docker layer caching)
COPY requirements.txt .

# Install Python dependencies with pip retry flags
# PyTorch will download correct Linux wheels automatically inside container
# --default-timeout=1000 : wait up to 1000s per read
# --retries 10            : retry 10 times on network failure
RUN pip install --no-cache-dir --default-timeout=1000 --retries 10 -r requirements.txt

# Copy application code
COPY . .

# Create data directory
# Create data directory
RUN mkdir -p /app/data

# Install nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Copy custom nginx config
COPY backend/nginx.conf /etc/nginx/nginx.conf

# Copy built static files from frontend
COPY frontend/dist /app/static

# Expose port (Vercel will override)
EXPOSE 8000

# Run both services (nginx foreground + uvicorn)
CMD /bin/bash -c "nginx -g 'daemon off;' & uvicorn app.main:app --host 0.0.0.0 --port $PORT"

# Expose port
EXPOSE 8000

# Start FastAPI
# Install nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built frontend static files (Vite output) into container
COPY ../frontend/dist /app/static

# Start nginx and FastAPI together
CMD /bin/bash -c "nginx -g 'daemon off;' & uvicorn app.main:app --host 0.0.0.0 --port $PORT"
