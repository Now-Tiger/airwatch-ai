# AirWatch AI

<div style="display: flex; justify-content: center; align-items: center; padding: 20px;">
  <img
    src="https://res.cloudinary.com/dq53c9400/image/upload/v1783527775/airwatchai-dashboard_egvsuj.png"
    alt="WindScope mascot"
    style="
      width: 800px;
      height: 550px;
      border-radius: 20px;
      object-fit: cover;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    "
  />
</div>

> A high-performance backend for managing real-time complaints.

AI-powered complaint intelligence backend that ingests multilingual pollution complaints (Hindi, English, Hinglish), processes them through an AI pipeline, detects duplicates, automatically creates and escalates tickets, and exposes hotspot analytics.

---

## Prerequisites

- Docker & Docker Compose
- [`uv`](https://docs.astral.sh/uv/) (only needed if running a service outside Docker)
- Make

## Setup

1. **Clone and configure environment**

   ```bash
   git clone https://github.com/Now-Tiger/airwatch-ai.git && cd airwatch-ai
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp worker/.env.example worker/.env
   ```

   Edit `.env` and set a real `OPENAI_API_KEY` & `OPENAI_BASE_URL`.

2. **Start infrastructure and services**

   ```bash
   make up
   # OR
   docker compose up -d
   ```

   This builds and starts `postgres`, `redis`, `rabbitmq`, `backend`, `worker`, and `gateway`.

3. **Verify health**

   ```bash
   curl http://localhost:8000/health
   ```

   Expected:

   ```json
   { "status": "ok", "node": "Uxyz101", "metadata": null }
   ```

4. **Dashboard**

Access web app dashboard @ **<http://localhost:3000>**

## Usage

```bash
# Ingest data: Add a complaint
curl -X 'POST' \
  'http://localhost:8000/complaints' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "text": "बहुत धुआं आ रहा है factory se near Anand Vihar, saans lena mushkil",
  "location": {
    "lat": 28.646,
    "lng": 77.316,
    "area": "Anand Vihar"
  },
  "photo_url": "https://example-url.com",
  "channel": "web",
  "submitted_at": "2026-07-07T18:17:59.671Z"
}'

# Get tickets
curl -X 'GET' \
  'http://localhost:8000/tickets' \
  -H 'accept: application/json'

# Update a ticket
curl -X 'PATCH' \
  'http://localhost:8000/tickets/55bf1038-d59b-408d-9378-4fd6bfcac7e7/status' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "status": "In Progress",
  "actor": "admin"
}'

# Get analytics
curl -X 'GET' \
  'http://localhost:8000/analytics/hotspots?hours_back=24' \
  -H 'accept: application/json'
```

**Interactive API docs (Swagger)**: **<http://localhost:8000/docs>**
**Use dashboard to perform actions @ <http://localhost:30000>**

## Logs & Observability

```bash
make logs                                    # all services, tailed
docker compose logs -f backend               # structured request logs (loguru, JSON)
docker compose logs -f worker                # CSV ingestion / fraud-flag recompute logs
```

## Core Features

- **AI Complaint Ingestion**: Accept pollution complaints from multiple channels (Web, Mobile, Social) in Hindi, English, or Hinglish through a single API and validate the incoming data before processing.
- **AI Complaint Intelligence**: Automatically analyze each complaint using an AI pipeline to classify its category, assign a priority score, detect urgency or health risks, and extract structured information such as pollution source, landmarks, and time references.
- **Resilient AI Engine**: Use a pluggable AI architecture with interchangeable providers. If the LLM is unavailable or times out, seamlessly switch to a deterministic rule-based engine so complaint processing never fails.
- **Smart Duplicate Detection**: Identify complaints referring to the same pollution incident based on category, geographic proximity, and time window, then merge them into a single case while maintaining a corroboration count.
- **Intelligent Ticket Management**: Automatically generate tickets for valid complaints, assign responsible officers using configurable routing rules, maintain the complete ticket lifecycle, and record every action in an audit trail.
- **SLA-Based Auto Escalation**: Continuously monitor unresolved tickets and automatically escalate high-priority cases when their SLA expires using configurable escalation policies.
- **Hotspot Analytics**: Aggregate complaint data by location, category, and time period to identify pollution hotspots and expose insights through analytics APIs for dashboards.
- **Thin Operations Dashboard**: Provide a lightweight interface to submit complaints, inspect AI-generated analysis, view ticket statuses, monitor duplicate detection, and demonstrate SLA escalation in real time.
- **Modular & Extensible Backend**: Design the backend using a clean, service-oriented architecture with clear separation between AI orchestration, business logic, persistence, and infrastructure, making the system easy to test and extend.
- **Production-Ready Reliability**: Ensure reliable processing through input validation, graceful failure handling, configurable workflows, Dockerized deployment, and a scalable architecture suitable for future queue-based processing and additional AI providers.
