# ─────────────────────────────────────────────────────────────────────────────
# FinPilot AI Backend — Production Dockerfile
# Multi-stage build: builder → runtime (minimal surface area)
# ─────────────────────────────────────────────────────────────────────────────

# Stage 1: Builder
FROM python:3.12-slim AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Production Runtime
FROM python:3.12-slim AS runtime

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Install only runtime system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 curl && rm -rf /var/lib/apt/lists/*

# Non-root user for security
RUN addgroup --system finpilot && adduser --system --ingroup finpilot finpilot

COPY backend/ .

RUN chown -R finpilot:finpilot /app
USER finpilot

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
