from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, field_validator, Field
import re
import uvicorn

from scraper import dna_ingestor
from engine import spectra_brain

# ─── Rate Limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Spectra Intelligence Engine")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS (unchanged from your original) ──────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://spectra-ai.vercel.app",
        "https://sspectra-ai.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── SSRF Prevention ──────────────────────────────────────────────────────────
# Only allows valid github.com repo URLs — blocks file://, internal IPs, etc.
GITHUB_URL_PATTERN = re.compile(
    r'^https://github\.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+(/.*)?$'
)

def validate_github_url(url: str) -> str:
    url = url.strip()
    if not GITHUB_URL_PATTERN.match(url):
        raise HTTPException(
            status_code=422,
            detail="Invalid repository URL. Must be a public GitHub URL (https://github.com/owner/repo)."
        )
    return url

# ─── Request Models ───────────────────────────────────────────────────────────
class RepoRequest(BaseModel):
    url: str = Field(..., min_length=10, max_length=300)

    @field_validator("url")
    @classmethod
    def url_must_be_github(cls, v):
        return validate_github_url(v)

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    repo_url: str = Field(..., min_length=10, max_length=300)

    @field_validator("repo_url")
    @classmethod
    def repo_url_must_be_github(cls, v):
        return validate_github_url(v)

class ExplainRequest(BaseModel):
    node_label: str       = Field(..., min_length=1, max_length=200)
    node_description: str = Field(..., min_length=1, max_length=1000)
    node_layer: str       = Field(..., min_length=1, max_length=100)
    node_tier: int        = Field(..., ge=0, le=10)
    repo_url: str         = Field(..., min_length=10, max_length=300)

    @field_validator("repo_url")
    @classmethod
    def repo_url_must_be_github(cls, v):
        return validate_github_url(v)

# ─── Keep-alive ───────────────────────────────────────────────────────────────
@app.get("/ping")
async def ping():
    return {"status": "alive", "service": "Spectra Intelligence Engine"}

@app.get("/")
async def root():
    return {"status": "alive", "service": "Spectra Intelligence Engine"}

# ─── Routes ───────────────────────────────────────────────────────────────────
@app.post("/analyze")
@limiter.limit("10/minute")
async def analyze_repo(request: Request, body: RepoRequest):
    result = await dna_ingestor.fetch_repo_structure(body.url)
    if isinstance(result, dict) and "error" in result:
        code = result["error"]
        if code == "GITHUB_RATE_LIMIT":
            raise HTTPException(status_code=429, detail={"code": code, "message": "GitHub rate limit. Wait ~1hr or add GITHUB_PAT to .env"})
        if code == "REPO_NOT_FOUND":
            raise HTTPException(status_code=404, detail={"code": code, "message": "Repo not found. Check the URL and make sure it's public."})
        raise HTTPException(status_code=400, detail={"code": code, "message": "GitHub fetch failed."})
    file_paths = result["paths"]
    file_list  = [{"path": p} for p in file_paths]
    graph_data = await spectra_brain.map_architecture(file_list, repo_url=body.url)
    if not graph_data:
        fallback = dna_ingestor.build_fallback_map(body.url, file_paths)
        return {"status": "fallback", "graph": fallback}
    return {"status": "success", "graph": graph_data}

@app.post("/explain")
@limiter.limit("20/minute")
async def explain_node(request: Request, body: ExplainRequest):
    result = await dna_ingestor.fetch_repo_structure(body.repo_url)
    file_list = [{"path": p} for p in result.get("paths", [])] if "paths" in result else []
    repo_name = body.repo_url.rstrip("/").split("/")[-1].upper()
    explanation = await spectra_brain.explain_node(
        node_label=body.node_label,
        node_description=body.node_description,
        node_layer=body.node_layer,
        node_tier=body.node_tier,
        repo_name=repo_name,
        file_list=file_list,
    )
    return explanation

@app.post("/chat")
@limiter.limit("15/minute")
async def chat_with_sentinel(request: Request, body: ChatRequest):
    result = await dna_ingestor.fetch_repo_structure(body.repo_url)
    file_list = [{"path": p} for p in result.get("paths", [])] if "paths" in result else []
    answer = await spectra_brain.chat_with_repo(body.message, file_list)
    return {"answer": answer}

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)