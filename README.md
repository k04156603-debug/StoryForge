# 🧠 Story Forge — AI Requirements Decomposer

> Convert Product Requirements Documents into structured Agile artifacts using AI

![Story Forge](https://img.shields.io/badge/version-1.0.0-6366f1) ![Node](https://img.shields.io/badge/node-%3E%3D18-green) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- **📄 PRD Input** — Upload PDF, DOCX, Markdown or paste directly
- **🔍 Feature Extraction** — AI-powered decomposition of unstructured PRDs into structured features
- **📝 Story Generation** — Agile user stories with acceptance criteria (Given-When-Then), edge cases, Fibonacci story points
- **🔎 Quality Analysis** — Detect ambiguity, missing requirements, contradictions, weak language with severity levels
- **🔗 Dependency Graph** — Interactive visualization with React Flow
- **📤 Export** — CSV, Markdown, Jira ticket creation

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  Dashboard │ Upload │ Processing │ Results           │
│  Zustand   │ React Flow │ Tailwind CSS              │
└─────────────────────┬───────────────────────────────┘
                      │ REST API
┌─────────────────────┴───────────────────────────────┐
│                  Backend (Express.js)                │
│  Routes → Controllers → Services → AI Pipeline      │
│  Middleware: Auth, Validation, Rate Limit, Logging   │
└────┬──────────┬──────────┬──────────┬───────────────┘
     │          │          │          │
   MongoDB    Redis     BullMQ    OpenAI API
```

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- Redis (optional, for caching & queue)
- OpenAI API key

### 1. Clone & Configure

```bash
# Copy environment config
cp .env.example .env

# Edit .env with your settings
# REQUIRED: Set OPENAI_API_KEY
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Docker (Alternative)

```bash
OPENAI_API_KEY=sk-your-key docker-compose up -d
```

## 📡 API Reference

### PRD Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/prd/upload` | Upload PRD (file or paste) |
| `POST` | `/api/prd/:id/process` | Start AI processing |
| `GET` | `/api/prd/:id` | Get PRD status |
| `GET` | `/api/prd` | List all PRDs |
| `DELETE` | `/api/prd/:id` | Delete PRD |

### Story Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stories/:prdId` | Get stories (grouped) |
| `GET` | `/api/stories/:prdId/stats` | Get story stats |
| `PUT` | `/api/stories/:id` | Update a story |

### Analysis Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analysis/:prdId/issues` | Get quality issues |
| `GET` | `/api/analysis/:prdId/summary` | Quality summary |
| `GET` | `/api/analysis/:prdId/dependencies` | Dependency graph |
| `PATCH` | `/api/analysis/issues/:id/resolve` | Resolve issue |

### Export Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/export/:prdId` | Export (csv/markdown/jira) |

## 🧪 Sample API Request/Response

### Upload PRD (paste)

```bash
curl -X POST http://localhost:5000/api/prd/upload \
  -H "Content-Type: application/json" \
  -d '{
    "title": "E-Commerce Platform",
    "content": "## Product Vision\nBuild an e-commerce platform that allows users to browse products, add to cart, checkout with multiple payment methods..."
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "title": "E-Commerce Platform",
    "fileType": "paste",
    "charCount": 2500,
    "status": "uploaded",
    "estimatedTime": 42
  }
}
```

### Start Processing

```bash
curl -X POST http://localhost:5000/api/prd/65f1a2b3c4d5e6f7a8b9c0d1/process
```

### Get Results (Stories)

```bash
curl http://localhost:5000/api/stories/65f1a2b3c4d5e6f7a8b9c0d1?grouped=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "feature": {
        "name": "Product Catalog",
        "category": "core",
        "priority": "critical"
      },
      "stories": [
        {
          "storyId": "US-01-001",
          "title": "Browse Product Catalog",
          "userStory": "As a customer, I want to browse the product catalog, so that I can discover products I'm interested in",
          "acceptanceCriteria": [
            {
              "given": "the customer is on the home page",
              "when": "they navigate to the catalog",
              "then": "they see a paginated list of products with images, names, and prices"
            }
          ],
          "edgeCases": ["Empty catalog state", "Network timeout during loading"],
          "storyPoints": 5,
          "priority": "high"
        }
      ]
    }
  ]
}
```

## 📊 AI Pipeline

```
PRD Text → Feature Extraction → Story Generation → Quality Analysis → Dependency Mapping
   │              │                    │                  │                    │
   └── Clean      └── Structured       └── Agile          └── Issues          └── Graph
       Text           Features            Stories             + Fixes            Nodes/Edges
```

Each stage uses structured prompts with:
- JSON output enforcement
- Response validation
- Retry with exponential backoff
- Error recovery

## 🗄️ Database Schema

- **Prd** — Document metadata, processing status, progress tracking
- **Feature** — Extracted features with actors, flows, categorization
- **UserStory** — Stories with acceptance criteria, edge cases, points, dependencies
- **QualityIssue** — Issues with severity, type, suggested fixes
- **DependencyGraph** — Nodes and edges for visualization

## 📁 Project Structure

```
├── backend/
│   └── src/
│       ├── ai/           # AI pipeline, prompts, validators, retry
│       ├── config/        # App config, DB, Redis connections
│       ├── controllers/   # Route handlers
│       ├── middleware/     # Auth, validation, rate limiting, logging
│       ├── models/        # Mongoose schemas
│       ├── queue/         # BullMQ worker
│       ├── routes/        # API routes
│       ├── services/      # Business logic
│       └── utils/         # Helpers, errors, logger
├── frontend/
│   └── src/
│       ├── api/           # Axios client
│       ├── components/    # UI components (layout, stories, quality, graph)
│       ├── hooks/         # Custom hooks
│       ├── pages/         # Dashboard, Upload, Processing, Results
│       └── store/         # Zustand state
├── docker-compose.yml
└── .env.example
```

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `PORT` | ❌ | Server port (default: 5000) |
| `REDIS_HOST` | ❌ | Redis host (default: localhost) |
| `JWT_SECRET` | ❌ | JWT signing secret |
| `JIRA_BASE_URL` | ❌ | Jira instance URL |
| `JIRA_API_TOKEN` | ❌ | Jira API token |

## 📜 License

MIT
