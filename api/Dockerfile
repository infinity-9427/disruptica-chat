FROM python:3.12-slim AS builder

# Configure pip with timeouts and retries
RUN pip config set global.timeout 600 && \
    pip config set global.retries 5

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install uv with retry logic
RUN pip install --no-cache-dir uv --timeout 600 || \
    (sleep 30 && pip install --no-cache-dir uv --timeout 600) || \
    (sleep 60 && pip install --no-cache-dir uv --timeout 600)

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv venv && uv sync || \
    (sleep 30 && uv sync) || \
    (sleep 60 && uv sync)

FROM python:3.12-slim AS production

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

RUN useradd --create-home --shell /bin/bash appuser

WORKDIR /app

COPY --from=builder /app/.venv /app/.venv

COPY --chown=appuser:appuser . .

RUN chmod +x scripts/entrypoint.sh

# Add health endpoint test script
RUN echo '#!/bin/bash\ncurl -f http://localhost:8080/health || exit 1' > /usr/local/bin/healthcheck.sh && \
    chmod +x /usr/local/bin/healthcheck.sh

USER appuser

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

ENTRYPOINT ["./scripts/entrypoint.sh"]
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]