import os
import re
import logging
from collections import defaultdict
from urllib.parse import urlparse, urlunparse

import httpx

logger = logging.getLogger("spectra.scraper")

IGNORED_DIRS = {
    "node_modules", ".git", "__pycache__", ".venv", "venv", "env",
    "dist", "build", ".next", ".nuxt", "coverage", ".pytest_cache",
    ".mypy_cache", "vendor", "target", ".terraform"
}

IGNORED_EXTENSIONS = {
    ".lock", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".woff", ".woff2",
    ".ttf", ".eot", ".map", ".pyc", ".DS_Store", ".pdf", ".zip", ".tar", ".gz"
}

MAX_FILES = 280

# ─── SSRF: Validate extracted owner/repo segments ─────────────────────────────
# Prevents path traversal (../../etc) and query injection (repo?token=x)
# from reaching the GitHub API URL construction.
OWNER_RE = re.compile(r'^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$')
REPO_RE  = re.compile(r'^[a-zA-Z0-9_.-]{1,100}$')

def _parse_github_owner_repo(repo_url: str) -> tuple[str, str]:
    parsed   = urlparse(repo_url.strip())
    clean    = urlunparse((parsed.scheme, parsed.netloc, parsed.path, "", "", ""))
    parts    = clean.rstrip("/").split("/")
    if len(parts) < 5:
        raise ValueError("URL missing owner/repo segments")
    owner, repo = parts[-2], parts[-1]
    if not OWNER_RE.match(owner) or not REPO_RE.match(repo):
        logger.warning(f"Blocked suspicious owner/repo: {owner[:40]!r}/{repo[:40]!r}")
        raise ValueError("Invalid owner or repo name")
    return owner, repo


class DNAIngestor:
    def __init__(self):
        self.token = os.getenv("GITHUB_PAT")
        if not self.token:
            logger.warning("GITHUB_PAT not set — running unauthenticated (60 req/hr limit)")

    def _get_headers(self):
        headers = {"Accept": "application/vnd.github.v3+json"}
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        return headers

    def _prune_tree(self, raw_items: list) -> list[str]:
        paths = []
        for item in raw_items:
            path = item.get("path", "")
            parts = path.split("/")
            if any(part in IGNORED_DIRS for part in parts):
                continue
            if any(path.endswith(ext) for ext in IGNORED_EXTENSIONS):
                continue
            if item.get("type") == "blob":
                paths.append(path)

        if len(paths) > MAX_FILES:
            root   = [p for p in paths if "/" not in p]
            src    = [p for p in paths if p.startswith(("src/", "app/", "lib/", "core/", "api/"))]
            config = [p for p in paths if p.startswith(("config/", "Dockerfile", "docker-compose", ".env.example"))]
            seen = set()
            priority = []
            for p in root + src + config:
                if p not in seen:
                    priority.append(p)
                    seen.add(p)
            others = [p for p in paths if p not in seen]
            paths = (priority + others)[:MAX_FILES]

        return paths

    def build_fallback_map(self, repo_url: str, file_paths: list[str]) -> dict:
        try:
            owner, repo_name = _parse_github_owner_repo(repo_url)
        except ValueError:
            owner, repo_name = "unknown", "unknown-repo"

        groups = defaultdict(list)
        for path in file_paths:
            segments = path.split("/")
            key = "[root]" if len(segments) == 1 else segments[0]
            groups[key].append(path)

        nodes = [{"id": "root", "data": {"label": repo_name.upper(), "layer": "core", "tier": 0, "description": f"Root of {owner}/{repo_name}"}}]
        edges = []
        for i, (group, files) in enumerate(groups.items()):
            nid = f"group_{i}"
            nodes.append({"id": nid, "data": {"label": group.upper(), "layer": "logic", "tier": 1, "description": f"{len(files)} files in /{group}"}})
            edges.append({"source": "root", "target": nid, "label": "CONTAINS"})

        return {"repo": f"{owner}/{repo_name}", "source": "fallback", "nodes": nodes, "edges": edges, "file_count": len(file_paths)}

    async def fetch_repo_structure(self, repo_url: str):
        # ── Validate owner/repo before building the API URL ───────────────────
        try:
            owner, repo = _parse_github_owner_repo(repo_url)
        except ValueError:
            return {"error": "REPO_NOT_FOUND"}

        # Only validated components touch the URL — never raw user input
        api_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1"

        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(connect=5.0, read=20.0, write=5.0, pool=5.0),
                follow_redirects=True
            ) as client:
                response = await client.get(api_url, headers=self._get_headers())

        except httpx.TimeoutException:
            logger.error(f"Timeout fetching {owner}/{repo}")
            return {"error": "GITHUB_TIMEOUT"}

        except Exception as e:
            # Never return str(e) — it leaks internal paths and library details
            logger.error(f"Unexpected error fetching {owner}/{repo}: {type(e).__name__}")
            return {"error": "GITHUB_UNKNOWN_ERROR"}

        if response.status_code in (403, 429):
            remaining = response.headers.get("X-RateLimit-Remaining", "0")
            return {"error": "GITHUB_RATE_LIMIT", "remaining": remaining}

        if response.status_code == 404:
            return {"error": "REPO_NOT_FOUND"}

        if response.status_code == 200:
            contents = response.json()
            pruned = self._prune_tree(contents.get("tree", []))
            logger.info(f"Fetched {owner}/{repo} → {len(pruned)} files")
            return {"paths": pruned, "repo_url": repo_url}

        return {"error": f"GITHUB_API_ERROR_{response.status_code}"}


dna_ingestor = DNAIngestor()