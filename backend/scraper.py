import os
import httpx
from collections import defaultdict

IGNORED_DIRS = {
    "node_modules", ".git", "__pycache__", ".venv", "venv", "env",
    "dist", "build", ".next", ".nuxt", "coverage", ".pytest_cache",
    ".mypy_cache", "vendor", "target", ".terraform"
}

IGNORED_EXTENSIONS = {
    ".lock", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".woff", ".woff2",
    ".ttf", ".eot", ".map", ".pyc", ".DS_Store", ".pdf", ".zip", ".tar", ".gz"
}

MAX_FILES = 280  # Safe buffer under Gemini Flash's context limit

class DNAIngestor:
    def __init__(self):
        self.token = os.getenv("GITHUB_PAT")  # Add to your .env

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
        """Called when GitHub succeeds but Gemini fails — uses real paths."""
        parts = repo_url.rstrip("/").split("/")
        repo_name = parts[-1] if parts else "unknown-repo"
        owner = parts[-2] if len(parts) >= 2 else "unknown"

        groups = defaultdict(list)
        for path in file_paths:
            segments = path.split("/")
            key = "[root]" if len(segments) == 1 else segments[0]
            groups[key].append(path)

        nodes = [{"id": "root", "label": repo_name, "type": "repository"}]
        edges = []
        for group, files in groups.items():
            nid = f"group_{group}"
            nodes.append({
                "id": nid, "label": group,
                "type": "directory", "file_count": len(files),
                "sample_files": files[:5]
            })
            edges.append({"source": "root", "target": nid})

        return {
            "repo": f"{owner}/{repo_name}",
            "source": "fallback",
            "nodes": nodes,
            "edges": edges,
            "file_count": len(file_paths),
        }

    async def fetch_repo_structure(self, repo_url: str):
        try:
            parts = repo_url.rstrip("/").split("/")
            owner, repo = parts[-2], parts[-1]
            api_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1"

            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.get(api_url, headers=self._get_headers())

            if response.status_code == 403 or response.status_code == 429:
                remaining = response.headers.get("X-RateLimit-Remaining", "0")
                return {"error": "GITHUB_RATE_LIMIT", "remaining": remaining}

            if response.status_code == 404:
                return {"error": "REPO_NOT_FOUND"}

            if response.status_code == 200:
                contents = response.json()
                pruned = self._prune_tree(contents.get("tree", []))
                print(f"✅ Found {len(pruned)} top-level pillars.")
                return {"paths": pruned, "repo_url": repo_url}  # ← return paths separately

            return {"error": f"GITHUB_API_ERROR_{response.status_code}"}

        except Exception as e:
            return {"error": str(e)}

dna_ingestor = DNAIngestor()