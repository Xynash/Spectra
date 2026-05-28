<div align="center">
<img src="https://capsule-render.vercel.app/api?type=venom&height=220&text=SPECTRA&fontSize=90&color=0:0d0014,100:1a0033&fontColor=a855f7&strokeWidth=2&stroke=a855f7&animation=fadeIn&desc=CODEBASE%20INTELLIGENCE%20UNIT&descSize=16&descAlignY=78&descAlign=50&descFontColor=666666" width="100%"/>
<br/>

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
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

It turns any GitHub repository — no matter how large, how old, or how undocumented — into something you can *see*, *talk to*, and *navigate*. Not someday. In seconds.

---

## 👁️ What Is SPECTRA?

SPECTRA is a **Codebase Intelligence Platform**. Drop in a GitHub URL. The Sentinel wakes up, reads the entire repository, builds a map of how everything connects, and answers your questions about it.
<img width="1855" height="915" alt="image" src="https://github.com/user-attachments/assets/51eefe43-6a1e-49b0-973d-3aa4af8aab6e" />


It was born from a real story — the frustration of trying to make a first contribution to [Meshery](https://github.com/meshery/meshery), a massive cloud-native project, with no guide and no map. Mentors were busy. The architecture was invisible.

SPECTRA makes the invisible, visible.

---

## 🌌 What Can It Do?

```
  [ INPUT ]                    [ SPECTRA ]                   [ OUTPUT ]

  GitHub URL     ──────►   Reads the whole repo     ──────►  Visual Map
  Your question  ──────►   Understands the logic    ──────►  Plain English answer  
  "Where's auth?"──────►   Finds it semantically    ──────►  Exact file + context
  You, confused  ──────►   Generates a roadmap      ──────►  Your first PR guide
```

No jargon. No digging. No asking a mentor for the fifth time.

---

## 🔬 How It Actually Works

### Step 1 — DNA Ingestion
SPECTRA uses the **GitHub GraphQL API v4** to fetch the entire repository in one batch — file tree, metadata, contribution history. Fast, efficient, rate-limit friendly.

### Step 2 — AST Decryption
It doesn't read your code as text. It uses **Tree-sitter** to parse it into an Abstract Syntax Tree — understanding that `Function A` in `auth.go` calls `Middleware B` in `router.js`, *across languages*. This builds the **Visual Map**.

### Step 3 — Semantic Memory
Every code chunk gets converted into vector embeddings via **OpenAI** and stored in **pgvector on Supabase**. So when you ask *"where is auth handled?"*, SPECTRA doesn't search for the word `auth` — it finds the *concept* of authentication. Anywhere it lives.

### Step 4 — The Sentinel Answers
**Claude 3.5 Sonnet** takes the retrieved context and generates a response — architecture summaries, logic explanations, or a step-by-step guide for your first pull request.

---

## 🛠️ Stack

| What | With |
|---|---|
| Frontend | Next.js 15, React 19, Zustand |
| 3D Sentinel | Three.js + React Three Fiber |
| Animations | Framer Motion |
| Backend | FastAPI (Python) |
| Code Parsing | Tree-sitter (multi-language AST) |
| Data Ingestion | GitHub GraphQL API v4 |
| AI Reasoning | Claude 3.5 Sonnet |
| Embeddings | OpenAI |
| Vector Search | pgvector on Supabase |

---

## 🗺️ Where Things Stand

| Phase | Name | Status |
|---|---|---|
| **Phase 1** | The Spectacle — full frontend, 3D Sentinel, dual-theme UI | ✅ Done |
| **Phase 2** | The Brain — FastAPI, GraphQL scraper, Claude prompt engineering | 🔄 In Progress |
| **Phase 3** | The Revelation — live Visual Maps, Codebase Chat, PR roadmaps | 🔮 Planned |

> **Right now:** The frontend is fully running. The backend brain is being wired up.

---

## 🚀 Run It Yourself

### You'll need
- Node.js 18+
- Python 3.10+ *(for the backend — Phase 2)*
- A [GitHub Personal Access Token](https://github.com/settings/tokens)
- An [Anthropic API key](https://console.anthropic.com) + [OpenAI API key](https://platform.openai.com)

### Frontend *(works today)*

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` — the Sentinel is watching.

### Backend *(Phase 2 — in progress)*

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # drop your API keys in here
uvicorn main:app --reload
```

---

## 🤝 Want to Contribute?

SPECTRA is a project *about* making open source contribution easier — so naturally, it welcomes contributors.

Good places to start:
- **More languages** — add Tree-sitter grammars for Rust, Go, Java
- **Better prompts** — improve the Claude 3.5 architecture summary prompts
- **UI themes** — new Galactic or Neo-Brutalism variants

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
