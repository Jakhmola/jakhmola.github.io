# Automated Ticketing System

An AI-powered IT support ticketing system combining LLM automation with human oversight. Tickets are extracted, classified, and either auto-resolved or escalated for human review — all driven through a conversational chat interface.

## Features

- **LLM-Powered Slot Extraction**: Automatically extracts `issue_type`, `severity`, and `affected_system` with per-slot confidence scores
- **Automated Resolve vs. Escalate**: Tickets with ≥85% aggregate confidence are auto-closed with a proposed fix; lower-confidence tickets are flagged for human review
- **Agentic Chat (LangGraph)**: Intent routing across three branches — Q&A, ticket creation, and review actions
- **Multi-Turn Ticket Creation**: Progressively prompts for missing fields (max 3 questions per turn) and maintains conversation context
- **Human Review Workflow**: Approve, edit, or reject tickets; validates comments for quality before persisting to `memory.json`
- **LLM-Optional**: All flows have deterministic fallbacks so the system works without an OpenAI key
- **Background Processor**: Polls `tickets.json` every 20 minutes and processes any new unprocessed tickets
- **REST API + Web UI**: FastAPI backend with a single-page chat frontend

## Project Structure

```
automated_ticketing_system/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   └── ticket.py               # Ticket and ReviewComment dataclasses
│   │   ├── routes/
│   │   │   ├── chat.py                 # POST /api/chat endpoint
│   │   │   └── tickets.py              # GET/POST /api/tickets endpoints
│   │   └── services/
│   │       ├── agent_graph.py          # LangGraph agentic chat orchestrator
│   │       ├── chat_service.py         # Legacy fallback chat service
│   │       ├── ticket_processor.py     # LLM slot extraction + resolve/escalate
│   │       ├── branches/
│   │       │   ├── intent_router.py    # Intent classification mixin
│   │       │   ├── qa_branch.py        # Q&A handling mixin
│   │       │   ├── review_branch.py    # Review workflow mixin
│   │       │   ├── ticket_creation_branch.py  # Multi-turn ticket creation mixin
│   │       │   └── review/             # Approve / edit / reject sub-handlers
│   │       └── utils/
│   │           └── ticket_utils.py     # Shared ticket helpers
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_chat_flow.py           # Integration tests (no LLM)
│   │   └── test_frontend_api.py        # End-to-end API tests via TestClient
│   ├── main.py                         # Uvicorn entry point + background processor
│   ├── print_graph.py                  # Utility: print/render the LangGraph topology
│   └── requirements.txt
├── frontend/
│   ├── static/
│   │   ├── css/style.css
│   │   └── js/app.js
│   └── templates/
│       └── index.html                  # Single-page chat UI
├── data/
│   ├── tickets.json                    # Ticket storage
│   └── memory.json                     # Review comment history
├── .env.example                        # Environment variable template
├── .gitignore
├── start_server.sh                     # Linux/macOS startup script
├── start_server.ps1                    # Windows (PowerShell) startup script
└── start_server.bat                    # Windows (CMD) startup script
```

## Setup

### 1. Install dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Linux/macOS
# venv\Scripts\activate         # Windows
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key (optional — the system works without one using heuristic fallbacks):

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

### 3. Start the server

```bash
# Linux/macOS
./start_server.sh

# Windows (PowerShell)
./start_server.ps1

# Or directly:
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API is available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.  
The chat UI is served at `http://localhost:8000/`.

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat` | Main chat endpoint (create tickets, review, Q&A) |
| `GET` | `/api/tickets` | List all tickets |
| `GET` | `/api/tickets/status/{status}` | Filter tickets by status |
| `GET` | `/api/tickets/severity/{severity}` | Filter tickets by severity |
| `POST` | `/api/tickets/process` | Manually trigger the ticket processor |
| `GET` | `/health` | Health check |

### Chat request payload

```json
{
  "message": "string",
  "user": "optional string (default: anonymous)",
  "ticket_id": "optional string (e.g. TICKET-0005)",
  "action": "optional string (approve | reject | edit)",
  "conversation_context": "optional object (carry state across multi-turn flows)"
}
```

## Usage Examples

### Creating a ticket

```
User:  "New ticket: The billing page freezes when I click Apply Discount."
Bot:   "Ticket TICKET-0042 created! Issue: Bug in the User Interface — The billing page freezes when clicking Apply Discount. Severity: Medium."
```

### Querying tickets

```
User:  "Show me all open high severity tickets"
Bot:   "Found 2 open High-severity tickets: ..."

User:  "Propose a fix for ticket 5"
Bot:   "Proposed fix for TICKET-0005: ..."
```

### Review workflow

```
User:  "Approve ticket 5"
Bot:   "Please provide comments describing what changed, why, and the steps to resolve."

User:  "Fixed query timeout by adding an index to the orders table. Verified with test dataset. Next step: deploy to staging and monitor for 48 hours."
Bot:   "Your comments are valid. Ticket TICKET-0005 marked as APPROVED."
```

## Running Tests

```bash
cd backend
pytest tests/ -v
```

Tests run without an OpenAI key and use deterministic fallback logic.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | *(empty)* | OpenAI key — leave empty to use heuristic fallbacks |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model used for LLM calls |
| `TICKETS_FILE` | `data/tickets.json` | Path to ticket storage file |
| `MEMORY_FILE` | `data/memory.json` | Path to review comment history |
| `HOST` | `0.0.0.0` | Server bind host |
| `PORT` | `8000` | Server port |
| `LOG_LEVEL` | `INFO` | Logging level |

## Technical Details

- **Backend**: FastAPI with RESTful API design
- **Frontend**: Vanilla JavaScript with responsive CSS
- **AI Integration**: OpenAI API for natural language processing
- **Data Storage**: JSON files for simplicity and portability
- **Processing**: Async background task processes tickets every 2 minutes

## Development Status

This is a demonstration/prototype implementation. For production use, consider:
- Database integration (PostgreSQL, MongoDB)
- Authentication and authorization
- Enhanced error handling
- Logging and monitoring
- Docker containerization
- Enhanced LLM prompts and validation
