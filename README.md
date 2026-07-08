# AI-powered complaint intelligence backend

A high-performance backend for managing real-time complaints.

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
