<div align="center">
<img src="https://capsule-render.vercel.app/api?type=venom&height=220&text=SPECTRA&fontSize=90&color=0:0d0014,100:1a0033&fontColor=a855f7&strokeWidth=2&stroke=a855f7&animation=fadeIn&desc=CODEBASE%20INTELLIGENCE%20UNIT&descSize=16&descAlignY=78&descAlign=50&descFontColor=666666" width="100%"/>
<br/>

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
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

## 👁️ What Is SPECTRA?

SPECTRA is a **codebase onboarding tool**. Drop in a GitHub URL. It reads the repository's structure, asks an LLM to organise it into a 4-tier architecture map, and lets you click through every part in plain English.

<img width="1855" height="915" alt="image" src="https://github.com/user-attachments/assets/51eefe43-6a1e-49b0-973d-3aa4af8aab6e" />

It was born from a real story: the frustration of trying to make a first contribution to [Meshery](https://github.com/meshery/meshery), a massive cloud-native project, with no guide and no map. Mentors were busy. The architecture was invisible.

SPECTRA makes the invisible, visible.

---

## 🌌 What Can It Do?

```
  [ INPUT ]                    [ SPECTRA ]                   [ OUTPUT ]

  GitHub URL     ──────►   Reads the repo structure  ──────►  Interactive 4-tier map
  Click a node   ──────►   Explains that component   ──────►  Plain-English breakdown
  Your question  ──────►   Answers from the layout   ──────►  Where to look next
  You, confused  ──────►   Builds an onboarding plan ──────►  Step-by-step guide
```

- **Architecture map:** root, domains, subsystems, entry points, revealed tier by tier.
- **Node deep-dive:** what it does, why it exists, how it works, where to start, first contribution tip.
- **Guide / Scope / Chat panels:** an onboarding roadmap, a big-picture summary, and a Q&A assistant called the Sentinel.

No jargon. No digging. No asking a mentor for the fifth time.

---

## 🔬 How It Actually Works

### Step 1: Tree Ingestion
The FastAPI backend calls the **GitHub REST API** (recursive git tree) to fetch every file path in the repository. Optional `GITHUB_PAT` support raises the rate limit.

### Step 2: Noise Pruning
Build folders, lockfiles, images and other noise are filtered out. Very large repos are capped by prioritising root, `src/`, `app/`, `lib/` and config paths, so only meaningful paths reach the model.

### Step 3: LLM Architecture Mapping
The pruned tree goes to **Groq**, which returns a strict JSON graph (nodes, edges, layers, tiers). The response is validated and laid out into four tiers.

- If Groq fails or returns an invalid graph, the backend falls back to **Gemini**, rotating through multiple API keys on rate limits.
- If every AI provider fails, a **deterministic folder-grouping map** is returned so the user still gets a result.

### Step 4: The Sentinel Explains
Clicking a node calls `/explain`, and the Chat panel calls `/chat`. Both are grounded in the repository's file structure.

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
| AI | Groq (primary), Google Gemini (fallback) |
| Data Source | GitHub REST API |

---

## 🗺️ Where Things Stand

| Phase | Name | Status |
|---|---|---|
| **Phase 1** | The Spectacle: frontend, 3D Sentinel, animated tier-by-tier reveal | ✅ Done |
| **Phase 2** | The Brain: FastAPI backend, GitHub ingestion, Groq/Gemini mapping with fallback | ✅ Done |
| **Phase 3** | The Deep Read: code-aware analysis (Tree-sitter parsing, embeddings, vector search) | 🔮 Planned |

> **Right now:** SPECTRA analyses a repository's **structure** (file paths). It does not yet read file contents, so explanations are inferred from layout and naming. Phase 3 is about closing that gap.

---

## 🚀 Run It Yourself

### You'll need
- Node.js 20+
- Python 3.10+
- A [Groq API key](https://console.groq.com)
- *(Optional)* Google Gemini API key(s) for fallback
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
GOOGLE_API_KEY_1=your_key      # optional, add _2, _3 ... for rotation
GITHUB_PAT=your_token          # optional
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
- **Code-aware analysis:** Tree-sitter parsing for Python, Go, JS/TS
- **Better prompts:** improve the architecture and explanation prompts
- **Caching:** cache GitHub tree fetches to save rate limit
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
