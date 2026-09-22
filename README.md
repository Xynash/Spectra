<div align="center">
<img src="https://capsule-render.vercel.app/api?type=venom&height=220&text=SPECTRA&fontSize=90&color=0:0d0014,100:1a0033&fontColor=a855f7&strokeWidth=2&stroke=a855f7&animation=fadeIn&desc=CODEBASE%20INTELLIGENCE%20UNIT&descSize=16&descAlignY=78&descAlign=50&descFontColor=666666" width="100%"/>
<br/>

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Groq](https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com)
</div>

---

<div align="center">
<i>"You opened a massive repository. Hundreds of folders. Zero context.<br/>
The senior engineers were busy. The docs were two years old.<br/>
You had no map."</i>
</div>

<br/>

**SPECTRA was built for that exact moment.**

It turns a public GitHub repository into an interactive architecture map you can *see*, *explore*, and *ask questions about*, so your first hour in an unfamiliar codebase isn't spent guessing where things live.

**Live:** [sspectra-ai.vercel.app](https://sspectra-ai.vercel.app)

---

## 👁️ What Is SPECTRA? (In the simplest words possible)

Imagine you walk into a giant library with a million books, no shelves labelled, no librarian around. You'd feel lost.

**SPECTRA is the librarian.**

You hand it a GitHub link. It walks through every room (folder) and every book (file), and draws you a simple map: *"this is the big picture, these are the main sections, these are the smaller rooms inside them, and here's exactly which book to open first."*

Then, if you're still confused, you can just **ask it a question in plain English** — and now, it doesn't just guess from the book titles. It actually **opens the books and reads them** before answering.

<img width="1855" height="915" alt="image" src="https://github.com/user-attachments/assets/51eefe43-6a1e-49b0-973d-3aa4af8aab6e" />

It was born from a real story: the frustration of trying to make a first contribution to [Meshery](https://github.com/meshery/meshery), a massive cloud-native project, with no guide and no map. Mentors were busy. The architecture was invisible.

SPECTRA makes the invisible, visible.

---

## 🌌 What Can It Do?

```
  [ INPUT ]                    [ SPECTRA ]                   [ OUTPUT ]

  GitHub URL     ──────►   Reads the repo structure  ──────►  Interactive 4-tier map
  Click a node   ──────►   Explains that component   ──────►  Plain-English breakdown
  Your question  ──────►   Reads real code, answers  ──────►  Grounded, specific answers
  You, confused  ──────►   Builds an onboarding plan ──────►  Step-by-step guide
```

- **Architecture map:** root, domains, subsystems, entry points, revealed tier by tier.
- **Node deep-dive:** what it does, why it exists, how it works, where to start, first contribution tip.
- **Guide / Scope / Chat panels:** an onboarding roadmap, a big-picture summary, and a Q&A assistant called the Sentinel — who now actually reads your code before replying.

No jargon. No digging. No asking a mentor for the fifth time.

---

## 🔬 How It Actually Works

**The five-year-old version:** SPECTRA looks at all the file names first and draws a map from that (fast, cheap). But when you *ask it something*, it stops guessing — it goes and opens the actual files, reads them, and only then answers you. Like a friend who skims the table of contents to draw you a map, but actually reads the chapter before answering your specific question.

**The real version:**

### Step 1: Tree Ingestion
The FastAPI backend calls the **GitHub REST API** (recursive git tree) to fetch every file path in the repository. Optional `GITHUB_PAT` support raises the rate limit.

### Step 2: Noise Pruning
Build folders, lockfiles, images, and other noise are filtered out. For very large repos, the pruning logic no longer relies on a hardcoded list of "known" source folder names — instead, it deprioritises known *non-source* folders (docs, tests, examples, assets) and treats everything else as real source, so unusual folder names don't get silently dropped.

### Step 3: LLM Architecture Mapping
The pruned tree goes to **Groq**, which returns a strict JSON graph (nodes, edges, layers, tiers). The response is validated and laid out into four tiers.

- If Groq fails or returns an invalid graph, the backend falls back to **Gemini**, rotating through multiple API keys on rate limits.
- If every AI provider fails, a **deterministic folder-grouping map** is returned so the user still gets a result.

### Step 4: The Sentinel Reads the Actual Code
This is the newest and biggest piece. When you ask the Sentinel a question:
- The actual file *content* of up to 25 key source files is fetched, chunked, and turned into embeddings (via **Gemini Embeddings**) — real semantic search, not filename guessing.
- An LLM (**Qwen, via Groq**) is given three tools — `search_code`, `read_file`, `list_directory` — and **decides for itself**, at runtime, which files to search or open and when it has enough to answer. Nothing in the backend code hardcodes that sequence.
- This loop is capped (max 6 tool-calling rounds) so it always lands on an answer within Groq's rate limits.

This makes the Chat/Guide/Scope panels **agentic RAG** in the literal sense: agentic (the model chooses its own steps) *and* RAG (it retrieves real content via embeddings before generating an answer). The architecture map itself (`/analyze`) still reasons from file structure only — reading full repo content for every file would be far too expensive to do upfront.

### Hardening
Strict GitHub URL validation and owner/repo sanitisation (SSRF prevention), Pydantic request limits, and per-endpoint rate limiting via slowapi.

---

## 🛠️ Stack

| What | With |
|---|---|
| Frontend | Next.js 16, React 19, Zustand, Tailwind CSS 4 |
| Graph UI | React Flow (`@xyflow/react`) |
| 3D Sentinel | Three.js + React Three Fiber |
| Backend | FastAPI (Python), slowapi |
| AI — Mapping | Groq (primary), Google Gemini (fallback) |
| AI — Chat | Qwen via Groq (agentic tool-calling) + Gemini Embeddings (semantic search) |
| Data Source | GitHub REST API + GitHub Contents API |

---

## 🗺️ Where Things Stand

| Phase | Name | Status |
|---|---|---|
| **Phase 1** | The Spectacle: frontend, 3D Sentinel, animated tier-by-tier reveal | ✅ Done |
| **Phase 2** | The Brain: FastAPI backend, GitHub ingestion, Groq/Gemini mapping with fallback | ✅ Done |
| **Phase 3** | The Deep Read: code-aware chat via embeddings + agentic tool-calling (real RAG) | ✅ Done for Chat |
| **Phase 4** | Full code-aware analysis: same depth of reading extended to the architecture map itself, Tree-sitter parsing | 🔮 Planned |

> **Right now:** The architecture map (`/analyze`) still reasons from file **structure** (paths and names) for speed. The **Chat/Guide/Scope** panels go a level deeper — they read real file content and search it semantically before answering. Phase 4 is about bringing that same depth to the map itself.

---

## 🚀 Run It Yourself

### You'll need
- Node.js 20+
- Python 3.10+
- A [Groq API key](https://console.groq.com)
- A Google Gemini API key (used for both fallback mapping and chat embeddings)
- *(Optional)* A [GitHub Personal Access Token](https://github.com/settings/tokens) for a higher rate limit

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Create `backend/.env`:

```
GROQ_API_KEY=your_key
GOOGLE_API_KEY_1=your_key        # add _2, _3 ... for rotation (used for fallback mapping + chat embeddings)
GEMINI_EMBED_MODEL=models/gemini-embedding-001   # optional override
GITHUB_PAT=your_token             # optional, but recommended (also used for chat's file reads)
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL` if your backend isn't on `http://localhost:8000`.

---

## 🤝 Want to Contribute?

SPECTRA is a project *about* making open source contribution easier, so naturally it welcomes contributors.

Good places to start:
- **Multi-turn chat memory:** the Sentinel currently starts fresh on every message — no conversation memory yet
- **Smarter file selection:** raise or make adaptive the 25-file cap on what gets embedded per repo
- **Cache eviction for retrieval:** the embedding cache has no size cap yet, unlike the tree-fetch cache
- **Better prompts:** improve the architecture and explanation prompts
- **UI themes:** new Galactic or Neo-Brutalism variants

Open an issue first if it's a big change. Let's talk.

---

<div align="center">

```
TRANSMISSION ENDS.
THE SENTINEL REMAINS ONLINE.
```

*Built with ❤️ by **Ansh Sharma***
*Inspired by the Meshery Story.*

**👁️ SPECTRA is watching.**

</div>
