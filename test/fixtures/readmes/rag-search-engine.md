# RAG Movie Search Engine

Movie search engine with Retrieval-Augmented Generation. Multiple retrieval strategies (BM25, semantic, hybrid, multimodal), LLM-powered query enhancement and re-ranking, augmented generation via Google Gemini, and full observability with MLflow.

## Stack

| Layer | Technology |
|-------|-----------|
| **API** | FastAPI, Uvicorn, Pydantic |
| **UI** | Streamlit |
| **Search** | BM25 (custom inverted index), Sentence Transformers (`all-MiniLM-L6-v2`), CLIP (`clip-ViT-B-32`) |
| **Fusion** | Weighted fusion, Reciprocal Rank Fusion (RRF) |
| **Enhancement** | Spell correction, query rewrite, query expansion via `gemma-3-27b-it` |
| **Re-ranking** | CrossEncoder (`ms-marco-TinyBERT-L2-v2`), LLM batch/individual ranking |
| **Generation** | `gemini-2.5-flash` — RAG answers, citations, summaries, Q&A |
| **Vector Store** | ChromaDB |
| **Tracking** | MLflow (experiment runs, traces, prompt registry) |
| **Infra** | Docker Compose, GitHub Actions CI |
| **Tooling** | uv, ruff, pytest |

## Features

- **Keyword search** — BM25 with TF-IDF scoring and Porter stemming
- **Semantic search** — Dense embeddings (384-dim), fixed-size and semantic chunking
- **Hybrid search** — BM25 + semantic via weighted fusion or RRF
- **Query enhancement** — Spell correction, rewriting, expansion via Gemma LLM
- **Re-ranking** — LLM-based (individual/batch) and CrossEncoder
- **Multimodal search** — Image-to-movie via CLIP
- **RAG generation** — Answers, citations, summaries, conversational Q&A
- **Evaluation** — Precision@k, Recall@k, F1 on golden dataset, LLM-as-judge
- **MLflow integration** — Experiment tracking, distributed tracing, prompt versioning
- **Streamlit UI** — Search, generate, and evaluate from the browser

## Architecture

```
                    ┌─────────────┐
                    │ Streamlit UI│ :8501
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  FastAPI    │ :8000
                    │  /search/* │
                    │  /generate │
                    │  /evaluate │
                    └──┬───┬───┬─┘
                       │   │   │
          ┌────────────┘   │   └────────────┐
          ▼                ▼                ▼
    ┌──────────┐    ┌───────────┐    ┌──────────┐
    │ ChromaDB │    │  MLflow   │    │  Gemini  │
    │  :8001   │    │  :5000    │    │   API    │
    └──────────┘    └───────────┘    └──────────┘
```

### Search Pipeline

```
Query → [Enhancement: spell/rewrite/expand] → BM25 + Semantic → Fusion (RRF/Weighted)
  → [Re-ranking: CrossEncoder/LLM] → [Generation: gemini-2.5-flash] → Response
```

## Quick Start

### Prerequisites

- Python >= 3.12, [uv](https://github.com/astral-sh/uv)
- Docker + Docker Compose
- Google Gemini API key

### Setup

```bash
cp .env.example .env          # add your GEMINI_API_KEY
uv sync                       # install dependencies
```

### Run with Docker

```bash
make up                       # start all services (API, UI, ChromaDB, MLflow)
make register-prompts         # seed prompts into MLflow
make migrate                  # migrate embeddings to ChromaDB
```

Services:

| Service | URL |
|---------|-----|
| Streamlit UI | http://localhost:8501 |
| FastAPI / Swagger | http://localhost:8000/docs |
| MLflow | http://localhost:5000 |
| ChromaDB | http://localhost:8001 |

### Run Locally (dev)

```bash
make dev                      # FastAPI on :8000
make ui                       # Streamlit on :8501
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/search/keyword` | BM25 search |
| POST | `/search/semantic` | Dense vector search |
| POST | `/search/hybrid` | Hybrid fusion search (RRF/weighted, enhancement, re-ranking) |
| POST | `/search/multimodal` | Image upload → CLIP search |
| POST | `/generate/rag` | RAG generation (rag, citations, summarize, question modes) |
| POST | `/evaluate/` | Run P/R/F1 evaluation on golden dataset |
| GET | `/health` | Health check |

## CLI

All CLIs are under `cli/` and can be run with `python cli/<name>.py <subcommand>`:

```bash
python cli/keyword_search_cli.py bm25search "animated superhero family"
python cli/hybrid_search_cli.py rrf-search "bear movie" --enhance spell --rerank-method cross_encoder
python cli/augmented_generation_cli.py rag "What movies are about time travel?"
python cli/evaluation_cli.py --limit 5
python cli/multimodal_search_cli.py image_search /path/to/image.jpg
```

## Make Commands

```
make up                 Start all Docker services
make down               Stop all services
make build              Build Docker images
make logs               Tail logs
make dev                Run FastAPI locally
make ui                 Run Streamlit locally
make migrate            Migrate embeddings to ChromaDB
make register-prompts   Seed prompts into MLflow
make test               Run pytest
make lint               Run ruff
make evaluate           Run evaluation suite
make stop               Kill process on port 8000
```

## Project Structure

```
├── app/
│   ├── main.py                  # FastAPI entrypoint
│   ├── config.py                # Centralized settings (pydantic-settings)
│   ├── api/                     # Routers: search, generation, evaluation
│   ├── core/                    # Search engines, enhancement, reranking, RAG, MLflow
│   └── models/                  # Pydantic schemas
├── ui/
│   └── app.py                   # Streamlit UI
├── cli/                         # Original CLI tools
├── scripts/                     # Migration & prompt registration scripts
├── tests/                       # 29 pytest tests
├── data/                        # movies.json, golden_dataset.json, stopwords.txt
├── docker-compose.yml           # 4 services: app, ui, chromadb, mlflow
├── Dockerfile                   # API container (multi-stage, pre-downloads models)
├── Dockerfile.ui                # Streamlit container (lightweight)
└── Makefile
```

## Data

- `movies.json` — Movie database (id, title, description). Full text used for indexing and embedding.
- `golden_dataset.json` — Query → relevant movie titles for evaluation.
- `stopwords.txt` — English stopwords for BM25 tokenization.
