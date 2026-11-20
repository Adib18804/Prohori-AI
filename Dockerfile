# ------------------------------------------------------------
# Simple FastAPI Docker image for Fly.io
# ------------------------------------------------------------
FROM python:3.12-slim

# OS‑ডিপেনডেন্সি (build‑time) – বেসিক gcc ও libpq (postgres client) থাকতে পারে
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc && \
    rm -rf /var/lib/apt/lists/*

# কাজের ডিরেক্টরি
WORKDIR /app

# কেবল requirements.txt‑কে ক্যাশ‑লেয়ারে রাখি (দ্রুত রিবিল্ড)
COPY backend/requirements.txt ./backend/requirements.txt

# পিপ‑ইনস্টল – সব ডিপেনডেন্সি ইনস্টল
RUN pip install --no-cache-dir -r backend/requirements.txt

# বাকি সোর্স‑কোড কপি (backend + অন্য সকল ফোল্ডার)
COPY . .

# Fly‑এর ডিফল্ট পোর্ট (ইন্টার্নাল) 8080
ENV PORT=8080
EXPOSE 8080

# অ্যাপ চালু – uvicorn ব্যবহার (app = FastAPI()‑এর নাম pp ধরা হয়েছে)
CMD ["uvicorn", "backend/app/main:app", "--host", "0.0.0.0", "--port", "8080"]
