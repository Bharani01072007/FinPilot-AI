# FinPilot AI — Enterprise Backend

Production-ready AI-powered Financial Operations Platform built with FastAPI, SQLAlchemy 2.x, Pydantic v2, and a full AI agent suite.

---

## Architecture

```
FinPilot AI
├── Backend Foundation          FastAPI + SQLAlchemy + Alembic
├── Database Architecture       PostgreSQL, BaseEntity, UUID PKs, soft delete
├── Authentication              JWT, bcrypt, account lockout, session revocation
├── User & Role Management      RBAC, Admin/Manager/Employee/Customer roles
├── Application Management      Lifecycle, assignment, priority, status history
├── Document Management         Upload, versioning, vault, tags, audit
├── Notification Platform       Event-driven, template engine, preferences
├── Reporting & Analytics       KPI engine, dashboards, export-ready
├── AI Platform Core            Gateway, providers, prompts, guardrails, memory, RAG
├── Document Intelligence       OCR pipeline, classification, extraction, confidence
├── KYC Verification Agent      Consistency checks, rules, risk flags, recommendations
├── Financial Risk Assessment   Income, employment, debt, consistency scoring
├── Knowledge Assistant         RAG-based customer support with source attribution
├── Recommendation Engine       Missing docs, next-best actions, operational insights
├── Multi-Agent Orchestration   Registry, coordinator, pre-defined workflows
└── Compliance                  GDPR, data retention, immutable audit log chaining
```

---

## Module Summary

| # | Module | Routes |
|---|--------|--------|
| 1 | Auth | `/api/v1/auth/*` |
| 2 | Users | `/api/v1/users/*` |
| 3 | Roles | `/api/v1/roles/*` |
| 4 | Applications | `/api/v1/applications/*` |
| 5 | Documents | `/api/v1/documents/*` |
| 6 | Document Vault | `/api/v1/vault/*` |
| 7 | Notifications | `/api/v1/notifications/*` |
| 8 | Reports | `/api/v1/reports/*` |
| 9 | AI Platform | `/api/v1/ai/*` |
| 10 | Document Intelligence | `/api/v1/ai/documents/*` |
| 11 | KYC Agent | `/api/v1/ai/kyc/*` |
| 12 | Risk Assessment | `/api/v1/ai/risk/*` |
| 13 | Knowledge Assistant | `/api/v1/ai/assistant/*` |
| 14 | Recommendations | `/api/v1/ai/recommendations/*` |
| 15 | Orchestration | `/api/v1/ai/orchestration/*` |

---

## Quick Start

### Local Development
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with DATABASE_URL and SECRET_KEY
uvicorn app.main:app --reload --port 8000
```

### Docker (Full Stack)
```bash
docker-compose up --build
```

### Production (with NGINX)
```bash
docker-compose --profile production up --build
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `SECRET_KEY` | ✓ | JWT signing secret (min 32 chars) |
| `ALGORITHM` | — | JWT algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | — | Token TTL (default: `30`) |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `AI_PROVIDER` | — | Default provider (`Gemini` / `OpenAI`) |
| `UPLOAD_DIR` | — | File storage path (default: `storage/uploads`) |

---

## Running Tests

```bash
# All tests (36 passing)
python -m pytest backend/tests -v

# Single module
python -m pytest backend/tests/test_enterprise_modules.py -v
```

---

## API Documentation

Swagger UI: `http://localhost:8000/docs`  
ReDoc: `http://localhost:8000/redoc`

---

## Security

- RBAC enforced at route level via `RequireRoles` dependency
- JWT with configurable expiry and session revocation
- Account lockout after 5 failed login attempts
- OWASP security headers via NGINX
- Rate limiting: 60 req/min API, 10 req/min auth
- Prompt injection protection via `Guardrails` layer
- PII redaction in AI context assembly
- Non-root Docker runtime user
- Immutable audit log hash chaining (SHA-256)

---

## Compliance Readiness

| Standard | Coverage |
|----------|----------|
| GDPR | Data export, right-to-erasure, retention policies |
| SOC2 | Immutable audit logs, RBAC, encrypted secrets |
| ISO27001 | Access control, audit trail, incident logging |
| Financial | 7-year audit log retention, immutable evidence |

---

## CI/CD

GitHub Actions pipeline at `.github/workflows/ci.yml`:
1. **Lint** — Ruff + Pyright
2. **Test** — pytest (36 tests)
3. **Build** — Multi-stage Docker image → GHCR push (main branch only)

---

## Kubernetes Readiness

- `/api/v1/health` — Liveness probe
- `/api/v1/health` — Readiness probe
- Horizontal scaling via stateless API workers (`--workers 4`)
- PostgreSQL + Redis managed externally via environment config
