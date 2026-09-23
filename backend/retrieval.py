"""
retrieval.py -- Phase A: real content retrieval for Spectra.
Per-repo in-memory cache (same TTL pattern as scraper.py). Line-based
chunking. Gemini embeddings. Cosine similarity, no vector DB.
"""

import os
import re
import time
import math
import base64
import logging
from dataclasses import dataclass

import httpx
from dotenv import load_dotenv
from google import genai

load_dotenv()

logger = logging.getLogger("retrieval")

CACHE_TTL = 600
MAX_FILES_TO_EMBED = 25
MAX_FILE_BYTES = 50_000
CHUNK_LINES = 80
CHUNK_OVERLAP = 15
TOP_K = 5

ALLOWED_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".go", ".rs", ".java", ".rb",
    ".md", ".json", ".yaml", ".yml", ".toml", ".txt", ".css", ".html",
    ".c", ".cpp", ".h", ".hpp", ".cs", ".php", ".sql",
}

EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL", "models/gemini-embedding-001")


@dataclass
class Chunk:
    path: str
    text: str
    vector: list


class RetrievalStore:
    def __init__(self):
        self._cache = {}
        self.keys = [v for k, v in os.environ.items() if k.startswith("GOOGLE_API_KEY_") and v]
        self._key_idx = 0
        self.client = genai.Client(api_key=self.keys[0]) if self.keys else None
        self.github_pat = os.getenv("GITHUB_PAT")

    def _headers(self):
        h = {"Accept": "application/vnd.github+json"}
        if self.github_pat:
            h["Authorization"] = f"Bearer {self.github_pat}"
        return h

    async def fetch_file_content(self, owner: str, repo: str, path: str):
        url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
        try:
            async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
                resp = await client.get(url, headers=self._headers())
            if resp.status_code != 200:
                return None
            data = resp.json()
            if data.get("encoding") != "base64":
                return None
            raw = base64.b64decode(data["content"])
            if len(raw) > MAX_FILE_BYTES:
                raw = raw[:MAX_FILE_BYTES]
            return raw.decode("utf-8", errors="ignore")
        except Exception as e:
            logger.warning("content fetch failed for %s: %s", path, type(e).__name__)
            return None

    def _chunk_text(self, text: str):
        lines = text.splitlines()
        step = CHUNK_LINES - CHUNK_OVERLAP
        for start in range(0, max(len(lines), 1), step):
            block = lines[start:start + CHUNK_LINES]
            if not block:
                continue
            yield "\n".join(block)
            if start + CHUNK_LINES >= len(lines):
                break

    def _embed(self, texts: list):
        if not self.client:
            return [[] for _ in texts]
        for _ in range(len(self.keys) or 1):
            try:
                result = self.client.models.embed_content(model=EMBED_MODEL, contents=texts)
                return [e.values for e in result.embeddings]
            except Exception as e:
                msg = str(e)
                if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
                    self._key_idx = (self._key_idx + 1) % len(self.keys)
                    self.client = genai.Client(api_key=self.keys[self._key_idx])
                    continue
                logger.warning("embed failed: %s", type(e).__name__)
                return [[] for _ in texts]
        return [[] for _ in texts]

    @staticmethod
    def _cosine(a, b):
        if not a or not b:
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a))
        nb = math.sqrt(sum(y * y for y in b))
        return 0.0 if na == 0 or nb == 0 else dot / (na * nb)

    async def _build_index(self, owner, repo, repo_url, file_paths):
        CODE_EXTENSIONS = {
            ".py", ".js", ".jsx", ".ts", ".tsx", ".go", ".rs", ".java", ".rb",
            ".c", ".cpp", ".h", ".hpp", ".cs", ".php", ".sql",
        }
        DEPRIORITIZED_PREFIXES = ("docs/", ".github/", "examples/", "scripts/", "tests/", "test/")

        def _rank(path):
            ext = os.path.splitext(path)[1]
            is_code = ext in CODE_EXTENSIONS
            is_deprioritized = path.startswith(DEPRIORITIZED_PREFIXES)
            if is_code and not is_deprioritized:
                return 0
            if is_code:
                return 1
            return 2

        eligible = [p for p in file_paths if os.path.splitext(p)[1] in ALLOWED_EXTENSIONS]
        candidates = sorted(eligible, key=_rank)[:MAX_FILES_TO_EMBED]
        chunks, chunk_texts = [], []
        for path in candidates:
            content = await self.fetch_file_content(owner, repo, path)
            if not content:
                continue
            for block in self._chunk_text(content):
                chunks.append(Chunk(path=path, text=block, vector=[]))
                chunk_texts.append(f"# {path}\n{block}")

        if not chunk_texts:
            self._cache[repo_url] = {"chunks": [], "ts": time.time()}
            return

        vectors = self._embed(chunk_texts)
        for c, v in zip(chunks, vectors):
            c.vector = v
        self._cache[repo_url] = {"chunks": chunks, "ts": time.time()}

    @staticmethod
    def parse_owner_repo(repo_url: str):
        m = re.match(r"https://github\.com/([^/]+)/([^/]+)", repo_url)
        if not m:
            return None, None
        return m.group(1), m.group(2).rstrip("/")

    async def get_relevant_chunks(self, repo_url: str, question: str, file_paths: list):
        entry = self._cache.get(repo_url)
        if not entry or (time.time() - entry["ts"]) > CACHE_TTL:
            owner, repo = self.parse_owner_repo(repo_url)
            if not owner:
                return []
            await self._build_index(owner, repo, repo_url, file_paths)
            entry = self._cache[repo_url]

        chunks = entry["chunks"]
        if not chunks:
            return []

        q_vec = self._embed([question])[0]
        if not q_vec:
            return []

        scored = sorted(chunks, key=lambda c: self._cosine(c.vector, q_vec), reverse=True)
        return [(c.path, c.text) for c in scored[:TOP_K]]


retrieval_store = RetrievalStore()




