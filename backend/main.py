from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from scraper import dna_ingestor
from engine import spectra_brain

app = FastAPI(title="Spectra Intelligence Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class RepoRequest(BaseModel):
    url: str

class ChatRequest(BaseModel):
    message: str
    repo_url: str

@app.post("/analyze")
async def analyze_repo(request: RepoRequest):
    # 1. Fetch DNA
    result = await dna_ingestor.fetch_repo_structure(request.url)

    if isinstance(result, dict) and "error" in result:
        code = result["error"]
        if code == "GITHUB_RATE_LIMIT":
            raise HTTPException(status_code=429, detail={"code": code, "message": "GitHub rate limit. Wait ~1hr or add GITHUB_PAT."})
        if code == "REPO_NOT_FOUND":
            raise HTTPException(status_code=404, detail={"code": code, "message": "Repo not found. Check the URL."})
        raise HTTPException(status_code=400, detail={"code": code, "message": "GitHub fetch failed."})

    # result = {"paths": [...], "repo_url": "..."}
    file_paths = result["paths"]
    
    # Convert to object format engine.py expects
    file_list = [{"path": p} for p in file_paths]

    # 2. Try AI
    graph_data = await spectra_brain.map_architecture(file_list, repo_url=request.url)

    if not graph_data:
        # AI fully exhausted — build smart fallback from REAL paths
        fallback = dna_ingestor.build_fallback_map(request.url, file_paths)
        return {"status": "fallback", "graph": fallback}

    return {"status": "success", "graph": graph_data}

@app.post("/chat")
async def chat_with_sentinel(request: ChatRequest):
    result = await dna_ingestor.fetch_repo_structure(request.repo_url)
    file_list = [{"path": p} for p in result.get("paths", [])] if "paths" in result else []
    answer = await spectra_brain.chat_with_repo(request.message, file_list)
    return {"answer": answer}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)